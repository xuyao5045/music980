module.exports = {
  db: {
    host: 'localhost',
    user: 'root',
    password: '672417',
    database: 'music980'
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '24h'
  },
  uploads: {
    music: './uploads/music/',
    avatar: './uploads/avatar/'
  }
}
