// ============================================================
// Express + MySQL 后端服务
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// API：获取所有题目
// ============================================================
app.get('/api/questions', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM questions ORDER BY sort_order ASC, id ASC'
        );
        // 将 options 从 JSON 字符串解析为对象（mysql2 对 JSON 列可能已自动解析）
        const questions = rows.map(q => ({
            ...q,
            options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null
        }));
        res.json({ success: true, data: questions });
    } catch (err) {
        console.error('获取题目失败:', err);
        res.status(500).json({ success: false, message: '获取题目失败' });
    }
});

// ============================================================
// API：管理员 - 添加题目
// ============================================================
app.post('/api/admin/questions', async (req, res) => {
    try {
        const { type, question, options, answer, referenceAnswer, score, sortOrder } = req.body;
        
        if (!type || !question || !score) {
            return res.status(400).json({ success: false, message: '缺少必要参数' });
        }

        if (type === 'choice') {
            if (!options || !Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ success: false, message: '选择题至少需要2个选项' });
            }
            if (answer === undefined || answer === null) {
                return res.status(400).json({ success: false, message: '请选择正确答案' });
            }
            await pool.execute(
                'INSERT INTO questions (type, question, options, answer, score, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                [type, question, JSON.stringify(options), String(answer), score, sortOrder || 0]
            );
        } else if (type === 'judge') {
            await pool.execute(
                'INSERT INTO questions (type, question, answer, score, sort_order) VALUES (?, ?, ?, ?, ?)',
                [type, question, String(!!answer), score, sortOrder || 0]
            );
        } else if (type === 'essay') {
            await pool.execute(
                'INSERT INTO questions (type, question, reference_answer, score, sort_order) VALUES (?, ?, ?, ?, ?)',
                [type, question, referenceAnswer || null, score, sortOrder || 0]
            );
        }

        res.json({ success: true, message: '题目添加成功' });
    } catch (err) {
        console.error('添加题目失败:', err);
        res.status(500).json({ success: false, message: '添加题目失败' });
    }
});

// ============================================================
// API：管理员 - 更新题目
// ============================================================
app.put('/api/admin/questions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { type, question, options, answer, referenceAnswer, score, sortOrder } = req.body;

        if (!type || !question || !score) {
            return res.status(400).json({ success: false, message: '缺少必要参数' });
        }

        if (type === 'choice') {
            await pool.execute(
                `UPDATE questions SET type=?, question=?, options=?, answer=?, score=?, sort_order=?, updated_at=NOW() WHERE id=?`,
                [type, question, JSON.stringify(options), String(answer), score, sortOrder || 0, id]
            );
        } else if (type === 'judge') {
            await pool.execute(
                `UPDATE questions SET type=?, question=?, answer=?, score=?, sort_order=?, updated_at=NOW() WHERE id=?`,
                [type, question, String(!!answer), score, sortOrder || 0, id]
            );
        } else if (type === 'essay') {
            await pool.execute(
                `UPDATE questions SET type=?, question=?, reference_answer=?, score=?, sort_order=?, updated_at=NOW() WHERE id=?`,
                [type, question, referenceAnswer || null, score, sortOrder || 0, id]
            );
        }

        res.json({ success: true, message: '题目更新成功' });
    } catch (err) {
        console.error('更新题目失败:', err);
        res.status(500).json({ success: false, message: '更新题目失败' });
    }
});

// ============================================================
// API：管理员 - 删除题目
// ============================================================
app.delete('/api/admin/questions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除题目失败:', err);
        res.status(500).json({ success: false, message: '删除题目失败' });
    }
});

// ============================================================
// API：提交答卷（学生）
// ============================================================
app.post('/api/submit', async (req, res) => {
    try {
        const { name, studentId, answers } = req.body;
        
        // 获取当前题库
        const [qRows] = await pool.execute(
            'SELECT * FROM questions ORDER BY sort_order ASC, id ASC'
        );

        let totalScore = 0;
        let maxScore = 0;
        let correct = 0;
        let wrong = 0;
        let unanswered = 0;

        // 评分
        qRows.forEach((q, i) => {
            maxScore += q.score;
            const userAnswer = answers && answers[i] !== undefined ? answers[i] : null;

            // 判断是否作答（简答题需要至少1个字符才算作答）
            const isAnswered = userAnswer !== null && userAnswer !== undefined &&
                (typeof userAnswer !== 'string' || String(userAnswer).trim().length > 0);

            if (!isAnswered) {
                unanswered++;
                return;
            }

            if (q.type === 'choice') {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
                if (parseInt(userAnswer) === parseInt(q.answer)) {
                    totalScore += q.score; correct++;
                } else { wrong++; }
            } else if (q.type === 'judge') {
                const ua = String(userAnswer).toLowerCase();
                const ca = String(q.answer).toLowerCase();
                if (ua === ca) { totalScore += q.score; correct++; }
                else { wrong++; }
            } else if (q.type === 'essay') {
                // 简答题：写满5个字给满分
                if (String(userAnswer).trim().length >= 5) {
                    totalScore += q.score; correct++;
                } else { wrong++; }
            }
        });

        // 保存记录
        await pool.execute(
            `INSERT INTO records (name, student_id, score, correct, wrong, answers, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [name, studentId, totalScore, correct, wrong, JSON.stringify(answers)]
        );

        res.json({
            success: true,
            data: {
                score: totalScore,
                maxScore: maxScore,
                correct: correct,
                wrong: wrong,
                unanswered: unanswered,
                totalQuestions: qRows.length
            }
        });
    } catch (err) {
        console.error('提交答卷失败:', err);
        res.status(500).json({ success: false, message: '提交答卷失败' });
    }
});

// ============================================================
// API：管理员 - 获取所有成绩记录
// ============================================================
app.get('/api/admin/records', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM records ORDER BY completed_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('获取记录失败:', err);
        res.status(500).json({ success: false, message: '获取记录失败' });
    }
});

// ============================================================
// API：管理员 - 清空所有成绩记录
// ============================================================
app.delete('/api/admin/records', async (req, res) => {
    try {
        await pool.execute('TRUNCATE TABLE records');
        res.json({ success: true, message: '清空成功' });
    } catch (err) {
        console.error('清空记录失败:', err);
        res.status(500).json({ success: false, message: '清空记录失败' });
    }
});

// ============================================================
// API：管理员 - 导出全部记录（返回文本）
// ============================================================
app.get('/api/admin/export', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM records ORDER BY completed_at DESC'
        );

        let content = '';
        content += '='.repeat(55) + '\n';
        content += '       大学社团在线答题 - 管理员成绩汇总\n';
        content += '='.repeat(55) + '\n';
        content += '导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
        content += '参与人数：' + rows.length + '\n';

        if (rows.length > 0) {
            const avg = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
            const max = Math.max(...rows.map(r => r.score));
            content += '平均分：' + avg + ' 分\n';
            content += '最高分：' + max + ' 分\n\n';
        }

        content += '-'.repeat(55) + '\n';
        content += '序号\t姓名\t学号\t\t得分\t答对\t答错\t完成时间\n';
        content += '-'.repeat(55) + '\n';

        rows.forEach((r, i) => {
            content += `${i+1}\t${r.name}\t${r.student_id}\t\t${r.score}分\t${r.correct}\t${r.wrong}\t${r.completed_at}\n`;
        });

        content += '\n' + '='.repeat(55) + '\n';
        content += '          答题系统自动生成\n';
        content += '='.repeat(55) + '\n';

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="admin_records_' + new Date().toISOString().slice(0,10) + '.txt"');
        res.send(content);
    } catch (err) {
        console.error('导出失败:', err);
        res.status(500).json({ success: false, message: '导出失败' });
    }
});

// ============================================================
// 前端路由兜底 - 返回 index.html
// ============================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// 启动服务器
// ============================================================
async function start() {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n========================================`);
        console.log(`  🚀 服务器已启动`);
        console.log(`  地址: http://localhost:${PORT}`);
        console.log(`========================================\n`);
    });
}

start().catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
});
