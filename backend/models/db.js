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
