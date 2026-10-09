const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const config = require('../config/config')

let pool

const initDB = async () => {
  try {
    // 先创建一个不带 database 参数的连接池，用于创建数据库
    const tempPool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    
    // 创建数据库（如果不存在）
    const tempConnection = await tempPool.getConnection()
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${config.db.database}`)
    tempConnection.release()
    tempPool.end()
    console.log('数据库创建/连接成功')
    
    // 连接到创建的数据库
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    
    // 创建数据库表
    await createTables()
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

// 确保某张表存在某个字段，缺失则 ALTER TABLE 补齐（兼容旧版本数据库）
const ensureColumn = async (connection, table, column, definition) => {
  const [columns] = await connection.execute(
    'SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
    [config.db.database, table, column]
  )
  if (columns.length === 0) {
    await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    console.log(`${table}.${column} 字段添加成功`)
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 兼容旧库：补齐后加的字段（CREATE TABLE IF NOT EXISTS 不会更新已有表结构）
    await ensureColumn(connection, 'user', 'is_admin', 'TINYINT DEFAULT 0')
    
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
    
    // 创建管理员账号（如果不存在），密码来自环境变量 ADMIN_PASSWORD；
    // 未配置时生成随机密码并打印一次，避免使用人尽皆知的默认密码
    const [adminExists] = await connection.execute('SELECT * FROM user WHERE username = ?', ['admin'])
    if (adminExists.length === 0) {
      const adminPassword = config.adminPassword || crypto.randomBytes(9).toString('base64url')
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await connection.execute('INSERT INTO user (username, password, is_admin) VALUES (?, ?, ?)', ['admin', hashedPassword, 1])
      console.log(`管理员账号创建成功: 用户名 admin，初始密码 ${adminPassword}（仅显示这一次，请立即登录并修改）`)
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
