const mysql = require('mysql2/promise')
const config = require('../config/config')

let pool

const initDB = async () => {
  try {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    console.log('数据库连接成功')
    
    // 创建数据库表
    await createTables()
  } catch (error) {
    console.error('数据库连接失败:', error)
    process.exit(1)
  }
}

const bcrypt = require('bcrypt')

const createTables = async () => {
  const connection = await pool.getConnection()
  
  try {
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 添加 is_admin 字段（如果不存在）
    try {
      // 检查 is_admin 字段是否存在
      const [columns] = await connection.execute(
        'SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
        [config.db.database, 'user', 'is_admin']
      )
      
      // 如果字段不存在，则添加
      if (columns.length === 0) {
        await connection.execute('ALTER TABLE user ADD COLUMN is_admin TINYINT DEFAULT 0')
        console.log('is_admin 字段添加成功')
      }
    } catch (error) {
      console.error('添加 is_admin 字段失败:', error)
    }
    
    // 音乐表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS music (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        artist VARCHAR(100) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        cover_url VARCHAR(255) DEFAULT NULL,
        uploader_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES user(id)
      )
    `)
    
    // 点赞表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        music_id INT NOT NULL,
        UNIQUE KEY user_music_unique (user_id, music_id),
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (music_id) REFERENCES music(id)
      )
    `)
    
    // 评论表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        music_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (music_id) REFERENCES music(id),
        FOREIGN KEY (user_id) REFERENCES user(id)
      )
    `)
    
    // 创建管理员账号（如果不存在）
    const [adminExists] = await connection.execute('SELECT * FROM user WHERE username = ?', ['admin'])
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await connection.execute('INSERT INTO user (username, password, is_admin) VALUES (?, ?, ?)', ['admin', hashedPassword, 1])
      console.log('管理员账号创建成功: 用户名 admin, 密码 admin123')
    }
    
    console.log('数据库表创建成功')
  } catch (error) {
    console.error('数据库表创建失败:', error)
  } finally {
    connection.release()
  }
}

const getPool = () => {
  if (!pool) {
    throw new Error('数据库连接未初始化')
  }
  return pool
}

module.exports = {
  initDB,
  getPool
}
