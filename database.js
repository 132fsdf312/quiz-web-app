// ============================================================
// 数据库配置
// ============================================================
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quiz_app',
    charset: 'utf8mb4'
};

// 创建连接池（自动管理连接复用）
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 初始化数据库表
async function initDatabase() {
    const conn = await pool.getConnection();
    try {
        // 创建题库表
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('choice','judge','essay') NOT NULL COMMENT '题目类型：选择题/判断题/简答题',
                question TEXT NOT NULL COMMENT '题目标题',
                options JSON DEFAULT NULL COMMENT '选择题选项JSON数组',
                answer TEXT DEFAULT NULL COMMENT '正确答案（选择题存索引，判断题存true/false）',
                reference_answer TEXT DEFAULT NULL COMMENT '简答题参考答案',
                score INT DEFAULT 10 COMMENT '本题分值',
                sort_order INT DEFAULT 0 COMMENT '排序序号',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建成绩记录表
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL COMMENT '姓名',
                student_id VARCHAR(30) NOT NULL COMMENT '学号',
                score INT NOT NULL DEFAULT 0 COMMENT '得分',
                correct INT DEFAULT 0 COMMENT '答对数',
                wrong INT DEFAULT 0 COMMENT '答错数',
                answers JSON DEFAULT NULL COMMENT '答案详情JSON',
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '完成时间',
                INDEX idx_student_id (student_id),
                INDEX idx_score (score)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ 数据库表检查完毕');

        // 如果题库为空，插入默认题目
        const [rows] = await conn.execute('SELECT COUNT(*) AS cnt FROM questions');
        if (rows[0].cnt === 0) {
            await insertDefaultQuestions(conn);
            console.log('✅ 默认题目已导入');
        }
    } finally {
        conn.release();
    }
}

async function insertDefaultQuestions(conn) {
    const defaults = [
        ['choice', '以下哪个不是JavaScript的数据类型？', JSON.stringify(['String','Boolean','Float','Symbol']), '2', null, 10, 1],
        ['choice', 'CSS中用于设置元素圆角的属性是？', JSON.stringify(['border-edge','border-radius','round-corner','corner-radius']), '1', null, 10, 2],
        ['choice', 'HTML5中用于绘制图形的元素是？', JSON.stringify(['<svg>','<canvas>','<draw>','<graphic>']), '1', null, 10, 3],
        ['choice', '在Git中，用于将暂存区内容提交到本地仓库的命令是？', JSON.stringify(['git push','git commit','git add','git pull']), '1', null, 10, 4],
        ['judge', 'HTML是一种编程语言。', null, 'false', null, 10, 5],
        ['judge', 'Python使用缩进来表示代码块。', null, 'true', null, 10, 6],
        ['judge', 'HTTP协议默认端口号是8080。', null, 'false', null, 10, 7],
        ['essay', '请简述什么是面向对象编程（OOP）？它的三大特性是什么？', null, null, '面向对象编程(OOP)是一种编程范式，它将程序组织为"对象"，每个对象包含数据和方法。三大特性：封装、继承、多态。', 10, 8],
        ['essay', '请简述数据库中SQL的增删改查分别对应哪些关键字？', null, null, '增：INSERT；删：DELETE；改：UPDATE/ALTER；查：SELECT。', 10, 9]
    ];
    
    for (const q of defaults) {
        await conn.execute(
            'INSERT INTO questions (type, question, options, answer, reference_answer, score, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            q
        );
    }
}

module.exports = { pool, initDatabase };
