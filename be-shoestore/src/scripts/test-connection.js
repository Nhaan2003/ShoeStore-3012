require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Configuration:');
  console.log(`- Host: ${process.env.DB_HOST}`);
  console.log(`- Port: ${process.env.DB_PORT}`);
  console.log(`- Database: ${process.env.DB_NAME}`);
  console.log(`- User: ${process.env.DB_USER}`);
  
  const sequelize = new Sequelize({
    dialect: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    },
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // List all tables
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_CATALOG = '${process.env.DB_NAME}'
    `);
    
    console.log('\n📋 Existing tables in database:');
    results.forEach(row => {
      console.log(`   - ${row.TABLE_NAME}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

testConnection();