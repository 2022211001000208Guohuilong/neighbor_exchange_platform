const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

// JWT 密钥（生产环境应该放在环境变量中）
const JWT_SECRET = 'your-secret-key-123456';
const JWT_EXPIRES_IN = '7d'; // token 有效期 7 天

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

//鉴权中间件
function authRequired(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ code: 401, message: '登录已过期' });
    }
}

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root', // 替换为你的MySQL用户名
    password: '123456', // 替换为你的MySQL密码
    database: 'neighbor_exchange_platform'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool.getConnection()
    .then(conn => {
        console.log('Connected to MySQL database，已连接');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// 路由
app.get('/goods', getAllGoods);
app.get('/goodsCate', getAllCate);
app.post('/goodsCate/add', addGoodsCategory);
app.post('/goodsCate/edit', editGoodsCategory);
app.post('/goodsCate/delete', deleteGoodsCategory);
app.get('/notice', getAllNotice);
app.post('/notice/add', addNotice);
app.post('/notice/edit', editNotice);
app.post('/notice/delete', deleteNotice);
app.post('/notice/top', topNotice);
app.get('/goods/view', incrementBrowseCount);
app.get('/goods/detail', getGoodsDetail);
app.get('/goods/my', getMyGoods);
app.get('/goods/nearby', getNearbyGoods);
app.post('/goods/add', addGoods);
app.post('/goods/edit', editGoods);
app.post('/goods/delete', deleteGoods);
app.get('/collect', getUserCollect);
app.post('/collect/add', addCollect);
app.post('/collect/delete', deleteCollect);
app.get('/goods/info', getGoodsInfo);

// 消息相关路由
app.get('/messages', getMessages);
app.get('/messages/admin', getAdminMessages);
app.post('/messages/read', markMessageAsRead);
app.post('/messages/admin/read', markAdminMessageAsRead);
app.post('/messages/delete', deleteMessage);
app.post('/message/send', sendMessage);
app.post('/message/admin/send', sendAdminMessage);

// 聊天相关路由
app.get('/chat/list', getChatList);
app.post('/chat/send', sendChatMessage);
app.post('/chat/read', markChatAsRead);
app.post('/all/read', markAllAsRead);


// 用户相关路由
app.get('/login', login);
app.post('/register', register);
app.get('/user/info', getUserInfo);
app.get('/user/list', getUserList);
app.delete('/user/delete', deleteUser);
app.post('/user/update', updateUserInfo);
app.post('/user/change-password', changePassword);
app.post('/user/reset-password', resetUserPassword);

// 交易相关路由
app.get('/trade/list/all', getAllTrade);
app.post('/trade/apply', applyTrade);
app.get('/trade/get', getTrade);
app.post('/trade/handle', handleTrade);
app.get('/trade/list', getTradeList);
app.get('/trade/detail', getTradeDetail);

// 地址相关路由
app.get('/address/list', getAddressList);
app.post('/address/add', addAddress);
app.post('/address/edit', editAddress);
app.post('/address/delete', deleteAddress);
app.post('/address/set-default', setDefaultAddress);

// 个性化推荐
app.get('/goods/recommend', authRequired, getRecommendGoods);
app.post('/behavior/report', authRequired, reportBehavior);

// 后台管理相关路由
app.post('/admin/login', adminLogin);
app.get('/admin/list', getAdminList);
app.post('/admin/add', addAdmin);
app.post('/admin/edit', editAdmin);
app.post('/admin/delete', deleteAdmin);
app.post('/admin/resetPassword', resetAdminPassword);
app.post('/admin/updatePassword', updateAdminPassword);
app.get('/admin/statistics/overview', getOverviewStatistics);
app.get('/admin/statistics/trend', getTrendStatistics);
app.get('/admin/statistics/trade', getTradeStatistics);
app.post('/admin/user/ban', banUser);
app.post('/admin/ban', banAdmin);
app.get('/admin/statistics/user', getUserStatistics);
app.get('/admin/goods/pending', getPendingGoods);
app.post('/admin/goods/audit', auditGoods);

// 商品评论相关路由
app.get('/comment/list', getCommentList);
app.post('/comment/add', addComment);
app.post('/comment/delete', deleteComment);
app.post('/admin/comment/hide', hideComment);

/** 
 * 登录 
 * @route GET /login 
 */
async function login(req, res) {
    console.log('登录请求');
    const { user_account, user_pwd } = req.query;

    if (!user_account || !user_pwd) {
        console.log('登录失败：账号密码不能为空');
        return res.status(400).json({ code: 400, message: '账号密码不能为空' });
    }

    try {
        // 查询用户
        const [rows] = await pool.query('SELECT * FROM user_base WHERE user_account = ?', [user_account]);

        if (rows.length === 0) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        if (rows[0].user_status === 1) {
            return res.status(401).json({ code: 401, message: '该账号状态异常' });
        }

        // 验证密码
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(user_pwd, user.user_pwd);

        if (!isPasswordValid) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        // 登录成功
        delete user.user_pwd; // 移除敏感信息

        // 生成 JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                userAccount: user.user_account
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            code: 200,
            message: '登录成功',
            data: {
                user,
                token  // 返回 token
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: '内部服务器错误: ' + err.message });
    }
}

/** 
 * 注册 
 * @route POST /register 
 */
async function register(req, res) {
    console.log('注册接口被调用');
    const { user_account, user_pwd } = req.body;  // 从请求体获取参数

    // 验证输入
    if (!user_account || !user_pwd) {
        return res.status(400).json({ code: 400, message: '账号密码不能为空' });
    }

    // 验证用户名和密码格式（可根据需求调整）
    if (user_account.length < 3 || user_account.length > 20) {
        return res.status(400).json({ code: 400, message: '账号长度应在3-20个字符之间' });
    }

    if (user_pwd.length < 3) {  // 原代码中密码验证条件有误，此处修正为至少6位
        return res.status(400).json({ code: 400, message: '密码长度至少为3个字符' });
    }

    try {
        // 检查用户名是否已存在
        const [existingUsers] = await pool.query('SELECT user_id FROM user_base WHERE user_account = ?', [user_account]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ code: 409, message: '账号已被占用' });
        }

        // 对密码进行加密处理
        const hashedPassword = await bcrypt.hash(user_pwd, saltRounds);

        // 创建新用户
        const [result] = await pool.query(
            'INSERT INTO user_base (user_account, user_pwd, user_nickname, user_status) VALUES (?, ?, ?, ?)',
            [user_account, hashedPassword, user_account, 0]
        );

        // 获取新创建的用户信息（不返回密码）
        const [newUserRows] = await pool.query(
            'SELECT user_id, user_account FROM user_base WHERE user_id = ?',
            [result.insertId]
        );

        if (newUserRows.length === 0) {
            throw new Error('用户创建后查询失败');
        }

        res.status(200).json({
            code: 200,
            message: '注册成功',
            data: newUserRows[0]
        });
    } catch (err) {
        console.error('注册错误:', err);
        res.status(500).json({ code: 500, message: '注册过程中发生错误' });
    }
}

/** 
 * 获取用户列表 (支持多条件筛选)
 * @route GET /user/list 
 */
async function getUserList(req, res) {
    console.log('收到查询请求参数:', req.query);
    try {
        // 1. 基础 SQL 语句 (排除密码字段)
        let sql = 'SELECT user_id, user_account, user_nickname, user_avatar, introduction, user_lng, user_lat, user_status, create_time, update_time FROM user_base WHERE 1=1';
        const params = [];

        // 2. 动态构建筛选条件
        // 筛选账号 (模糊查询)
        if (req.query.user_account) {
            sql += ' AND user_account LIKE ?';
            params.push(`%${req.query.user_account}%`);
        }

        // 筛选昵称 (模糊查询)
        if (req.query.user_nickname) {
            sql += ' AND user_nickname LIKE ?';
            params.push(`%${req.query.user_nickname}%`);
        }

        // 筛选账号状态 (精确查询)
        // user_status: 0 - 正常，1 - 禁用
        // 注意：0 在 JS 中是假值，且前端默认值可能是 0，需要根据业务逻辑判断
        // 如果前端传了 status 参数且不是空字符串，则进行筛选
        if (req.query.user_status !== undefined && req.query.user_status !== '' && req.query.user_status < 3) {
            sql += ' AND user_status = ?';
            params.push(req.query.user_status);
        }

        // 4. 执行查询
        const [rows] = await pool.query(sql, params);

        // 5. 返回结果
        res.status(200).json({
            code: 200,
            message: '获取用户列表成功',
            data: rows
        });
    } catch (err) {
        console.error('获取用户列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 删除用户 
 * @route DELETE /user/delete 
 */
async function deleteUser(req, res) {
    console.log('收到删除用户请求', req.query);
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. 验证用户是否存在 
        const [userRows] = await conn.query(
            'SELECT user_id FROM user_base WHERE user_id = ?',
            [user_id]
        );
        if (userRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        // 2. (完善建议) 检查是否有未完成的交易
        const [tradeRows] = await conn.query(
            'SELECT trade_id FROM goods_trade WHERE (from_user_id = ? OR to_user_id = ?) AND trade_status IN (1, 2)',
            [user_id, user_id]
        );
        if (tradeRows.length > 0) {
            await conn.rollback();
            return res.status(400).json({ code: 400, message: '该用户有进行中的交易，无法删除' });
        }

        // 3. 执行删除操作 (假设已设置外键级联删除相关物品和地址)
        await conn.query('DELETE FROM user_base WHERE user_id = ?', [user_id]);

        await conn.commit();
        res.status(200).json({
            code: 200,
            message: '用户及其关联数据已成功删除',
            data: { user_id }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('删除用户失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
}

/**
 * 获取用户信息
 * @route GET /user/info
 */
async function getUserInfo(req, res) {
    console.log('获取用户信息');
    const { user_id } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 查询所有字段
        const [row] = await pool.query(
            'SELECT * FROM user_base WHERE user_id = ?',
            [user_id]
        );

        if (row.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        // 使用对象解构排除 user_pwd
        const { user_pwd, ...userData } = row[0];

        res.status(200).json({
            code: 200,
            message: '获取用户信息成功',
            data: userData
        });
    } catch (err) {
        console.error('获取用户信息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 更新用户信息
 * @route POST /user/update
 */
async function updateUserInfo(req, res) {
    console.log('更新用户信息', req.body);
    const { user_id, user_nickname, introduction, user_avatar } = req.body;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 验证用户是否存在
        const [userRows] = await pool.query(
            'SELECT user_id FROM user_base WHERE user_id = ?',
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        // 构建动态更新SQL
        const updates = [];
        const params = [];

        if (user_nickname !== undefined) {
            updates.push('user_nickname = ?');
            params.push(user_nickname);
        }

        if (introduction !== undefined) {
            updates.push('introduction = ?');
            params.push(introduction);
        }

        if (user_avatar !== undefined) {
            updates.push('user_avatar = ?');
            params.push(user_avatar);
        }

        if (updates.length === 0) {
            return res.status(400).json({ code: 400, message: '没有要更新的字段' });
        }

        params.push(user_id);

        // 执行更新
        await pool.query(
            `UPDATE user_base SET ${updates.join(', ')}, update_time = NOW() WHERE user_id = ?`,
            params
        );

        // 获取更新后的用户信息
        const [updatedRows] = await pool.query(
            'SELECT * FROM user_base WHERE user_id = ?',
            [user_id]
        );

        const { user_pwd, ...userData } = updatedRows[0];

        res.status(200).json({
            code: 200,
            message: '更新用户信息成功',
            data: userData
        });
    } catch (err) {
        console.error('更新用户信息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 修改密码
 * @route POST /user/change-password
 */
async function changePassword(req, res) {
    console.log('修改密码', req.body);
    const { user_id, old_password, new_password } = req.body;

    // 验证参数
    if (!user_id || !old_password || !new_password) {
        return res.status(400).json({ code: 400, message: '用户ID、旧密码和新密码不能为空' });
    }

    // 验证新密码长度
    if (new_password.length < 3) {
        return res.status(400).json({ code: 400, message: '新密码长度至少为3个字符' });
    }

    try {
        // 验证用户是否存在
        const [userRows] = await pool.query(
            'SELECT user_id, user_pwd FROM user_base WHERE user_id = ?',
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        // 验证旧密码是否正确
        const user = userRows[0];
        const isPasswordValid = await bcrypt.compare(old_password, user.user_pwd);

        if (!isPasswordValid) {
            return res.status(401).json({ code: 401, message: '旧密码错误' });
        }

        // 对新密码进行加密处理
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        // 更新密码
        await pool.query(
            'UPDATE user_base SET user_pwd = ?, update_time = NOW() WHERE user_id = ?',
            [hashedPassword, user_id]
        );

        res.status(200).json({
            code: 200,
            message: '密码修改成功'
        });
    } catch (err) {
        console.error('修改密码失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 重置用户密码（管理员操作）
 * @route POST /user/reset-password
 */
async function resetUserPassword(req, res) {
    console.log('重置用户密码', req.body);
    const { user_id } = req.body;
    const defaultPassword = '123456';

    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        const [userRows] = await pool.query(
            'SELECT user_id FROM user_base WHERE user_id = ?',
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

        await pool.query(
            'UPDATE user_base SET user_pwd = ?, update_time = NOW() WHERE user_id = ?',
            [hashedPassword, user_id]
        );

        res.status(200).json({
            code: 200,
            message: `密码已重置为${defaultPassword}`,
            data: { user_id, reset_password: defaultPassword }
        });
    } catch (err) {
        console.error('重置密码失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 封禁用户 
 * @route POST /admin/user/ban 
 */
async function banUser(req, res) {
    console.log('封禁用户', req.body);
    const { user_id, user_status } = req.body;

    if (user_id === undefined || user_id === null || user_id === '') {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }
    if (user_status === undefined || user_status === null || user_status === '') {
        return res.status(400).json({ code: 400, message: '用户状态不能为空' });
    }

    const parsedStatus = Number(user_status);
    if (!Number.isInteger(parsedStatus) || ![0, 1].includes(parsedStatus)) {
        return res.status(400).json({ code: 400, message: '用户状态必须是0（正常）或1（禁用）' });
    }

    try {
        const [userRows] = await pool.query(
            'SELECT user_id, user_status FROM user_base WHERE user_id = ?',
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        await pool.query(
            'UPDATE user_base SET user_status = ?, update_time = NOW() WHERE user_id = ?',
            [parsedStatus, user_id]
        );

        res.status(200).json({
            code: 200,
            message: parsedStatus === 1 ? '用户已封禁' : '用户已解封',
            data: { user_id, user_status: parsedStatus }
        });
    } catch (err) {
        console.error('封禁用户失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 获取用户统计数据 
 * @route GET /admin/statistics/user 
 */
async function getUserStatistics(req, res) {
    const days = parseInt(req.query.days) || 7;
    try {
        const today = new Date().toISOString().split('T')[0];

        const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM user_base');
        const [todayRows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_base WHERE DATE(create_time) = ?',
            [today]
        );
        const [activeRows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_base WHERE user_status = 0'
        );

        const dateList = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dateList.push(d.toISOString().split('T')[0]);
        }

        const [trendRows] = await pool.query(`
            SELECT DATE(create_time) as date, COUNT(*) as count
            FROM user_base
            WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(create_time)
            ORDER BY date ASC
        `, [days]);

        const [activeTrendRows] = await pool.query(`
            SELECT DATE(create_time) as date, COUNT(*) as count
            FROM user_base
            WHERE user_status = 0
              AND create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(create_time)
            ORDER BY date ASC
        `, [days]);

        const mapTrend = new Map(trendRows.map(r => [r.date.toISOString().split('T')[0], r.count]));
        const mapActiveTrend = new Map(activeTrendRows.map(r => [r.date.toISOString().split('T')[0], r.count]));

        const format = (list, map) => list.map(date => ({
            date: date.substring(5),
            count: map.get(date) || 0
        }));

        res.status(200).json({
            code: 200,
            message: '获取用户统计数据成功',
            data: {
                total: totalRows[0].count,
                today: todayRows[0].count,
                active: activeRows[0].count,
                trend: format(dateList, mapTrend),
                activeTrend: format(dateList, mapActiveTrend)
            }
        });
    } catch (err) {
        console.error('获取用户统计数据失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 管理员登录 
 * @route POST /admin/login 
 */
async function adminLogin(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ code: 400, message: '账号密码不能为空' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM admin_base WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        const admin = rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        //状态：1-正常，2-禁用
        if (admin.status === 2) {
            return res.status(401).json({ code: 401, message: '账号已被禁用' });
        }

        const token = jwt.sign(
            {
                adminId: admin.id,
                username: admin.username,
                role: admin.role,
                type: 'admin'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password: _, ...adminData } = admin;
        res.status(200).json({
            code: 200,
            message: '登录成功',
            data: {
                admin: adminData,
                token
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: '内部服务器错误: ' + err.message });
    }
}

/** 
 * 添加管理员 
 * @route POST /admin/add 
 */
async function addAdmin(req, res) {
    const { username, password, role, avatar } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ code: 400, message: '账号密码不能为空' });
    }
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ code: 400, message: '账号长度应在3-50个字符之间' });
    }
    if (password.length < 3) {
        return res.status(400).json({ code: 400, message: '密码长度至少为3个字符' });
    }

    const parsedRole = role === undefined || role === null || role === '' ? 1 : Number(role);
    if (!Number.isInteger(parsedRole) || ![1, 2].includes(parsedRole)) {
        return res.status(400).json({ code: 400, message: '角色必须是1（普通管理员）或2（超级管理员）' });
    }

    try {
        const [existingRows] = await pool.query(
            'SELECT id FROM admin_base WHERE username = ?',
            [username]
        );
        if (existingRows.length > 0) {
            return res.status(409).json({ code: 409, message: '账号已被占用' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await pool.query(
            'INSERT INTO admin_base (username, password, role, avatar) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, parsedRole, avatar || null]
        );

        const [newRows] = await pool.query(
            'SELECT id, username, role, avatar, created_time, updated_time FROM admin_base WHERE id = ?',
            [result.insertId]
        );

        res.status(200).json({
            code: 200,
            message: '添加成功',
            data: newRows[0]
        });
    } catch (err) {
        console.error('管理员注册失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 获取管理员列表 
 * @route GET /admin/list 
 */
async function getAdminList(req, res) {
    try {
        let sql = 'SELECT id, username, role, status, avatar, created_time, updated_time FROM admin_base WHERE 1=1';
        const params = [];

        if (req.query.username) {
            sql += ' AND username LIKE ?';
            params.push(`%${req.query.username}%`);
        }
        if (req.query.role !== undefined && req.query.role !== '') {
            sql += ' AND role = ?';
            params.push(req.query.role);
        }

        const [rows] = await pool.query(sql, params);

        res.status(200).json({
            code: 200,
            message: '获取管理员列表成功',
            data: {
                admin: rows,
                total: rows.length
            }
        });
    } catch (err) {
        console.error('获取管理员列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 编辑管理员 
 * @route POST /admin/edit 
 */
async function editAdmin(req, res) {
    const { id, username, password, role, avatar } = req.body || {};
    if (!id) {
        return res.status(400).json({ code: 400, message: '管理员ID不能为空' });
    }

    const updates = [];
    const params = [];

    if (username !== undefined) {
        if (!username) {
            return res.status(400).json({ code: 400, message: '账号不能为空' });
        }
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ code: 400, message: '账号长度应在3-50个字符之间' });
        }
    }

    if (role !== undefined) {
        const parsedRole = Number(role);
        if (!Number.isInteger(parsedRole) || ![1, 2].includes(parsedRole)) {
            return res.status(400).json({ code: 400, message: '角色必须是1（普通管理员）或2（超级管理员）' });
        }
        updates.push('role = ?');
        params.push(parsedRole);
    }

    if (avatar !== undefined) {
        updates.push('avatar = ?');
        params.push(avatar || null);
    }

    try {
        const [existingAdmin] = await pool.query(
            'SELECT id FROM admin_base WHERE id = ?',
            [id]
        );
        if (existingAdmin.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }

        if (username !== undefined) {
            const [dupRows] = await pool.query(
                'SELECT id FROM admin_base WHERE username = ? AND id <> ?',
                [username, id]
            );
            if (dupRows.length > 0) {
                return res.status(409).json({ code: 409, message: '账号已被占用' });
            }
            updates.push('username = ?');
            params.push(username);
        }

        if (password !== undefined) {
            if (!password) {
                return res.status(400).json({ code: 400, message: '密码不能为空' });
            }
            if (password.length < 3) {
                return res.status(400).json({ code: 400, message: '密码长度至少为3个字符' });
            }
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ code: 400, message: '没有要更新的字段' });
        }

        params.push(id);
        await pool.query(
            `UPDATE admin_base SET ${updates.join(', ')}, updated_time = NOW() WHERE id = ?`,
            params
        );

        const [rows] = await pool.query(
            'SELECT id, username, role, avatar, created_time, updated_time FROM admin_base WHERE id = ?',
            [id]
        );

        res.status(200).json({
            code: 200,
            message: '管理员信息更新成功',
            data: rows[0]
        });
    } catch (err) {
        console.error('编辑管理员失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 重置管理员密码 
 * @route POST /admin/resetPassword 
 */
async function resetAdminPassword(req, res) {
    console.log('重置管理员密码请求:', req.body);
    const { id } = req.body || {};
    const defaultPassword = '123456';

    if (!id) {
        return res.status(400).json({ code: 400, message: '管理员ID不能为空' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id FROM admin_base WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }

        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
        await pool.query(
            'UPDATE admin_base SET password = ?, updated_time = NOW() WHERE id = ?',
            [hashedPassword, id]
        );

        res.status(200).json({
            code: 200,
            message: `密码已重置为${defaultPassword}`,
            data: { id, reset_password: defaultPassword }
        });
    } catch (err) {
        console.error('重置管理员密码失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 修改管理员密码 
 * @route POST /admin/updatePassword 
 */
async function updateAdminPassword(req, res) {
    console.log('修改管理员密码请求:', req.body);
    const { id, oldPwd, newPwd } = req.body || {};

    if (!id || !oldPwd || !newPwd) {
        return res.status(400).json({ code: 400, message: '管理员ID、旧密码和新密码不能为空' });
    }
    if (String(newPwd).length < 3) {
        return res.status(400).json({ code: 400, message: '新密码长度至少为3个字符' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, password FROM admin_base WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }

        const admin = rows[0];
        const isPasswordValid = await bcrypt.compare(oldPwd, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ code: 401, message: '旧密码错误' });
        }

        const hashedPassword = await bcrypt.hash(newPwd, saltRounds);
        await pool.query(
            'UPDATE admin_base SET password = ?, updated_time = NOW() WHERE id = ?',
            [hashedPassword, id]
        );

        res.status(200).json({
            code: 200,
            message: '密码修改成功',
            data: { id }
        });
    } catch (err) {
        console.error('修改管理员密码失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 删除管理员 
 * @route POST /admin/delete 
 */
async function deleteAdmin(req, res) {
    const { id } = req.body || {};
    if (!id) {
        return res.status(400).json({ code: 400, message: '管理员ID不能为空' });
    }

    try {
        const [rows] = await pool.query('SELECT id FROM admin_base WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }

        await pool.query('DELETE FROM admin_base WHERE id = ?', [id]);
        res.status(200).json({
            code: 200,
            message: '管理员已删除',
            data: { id }
        });
    } catch (err) {
        console.error('删除管理员失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 提交交易申请
 * @route POST /trade/apply
 */
async function applyTrade(req, res) {
    console.log('提交交易申请', req.body);
    const { from_user_id, to_user_id, goods_id, trade_type, exchange_type, addr_id, apply_price, apply_item, apply_desc } = req.body;

    // 验证必填参数
    if (!from_user_id || !to_user_id || !goods_id || !trade_type) {
        return res.status(400).json({ code: 400, message: '申请人ID、物主ID、物品ID和交易类型不能为空' });
    }

    // 验证交易类型
    if (trade_type !== 1 && trade_type !== 2) {
        return res.status(400).json({ code: 400, message: '交易类型必须是1（购买）或2（交换）' });
    }

    // 如果是交换类型，apply_item 不能为空
    if (trade_type === 2 && !apply_item) {
        return res.status(400).json({ code: 400, message: '交换交易必须提供交换物品' });
    }

    try {
        // 验证物品是否存在
        const [goodsRows] = await pool.query('SELECT goods_id, user_id FROM goods_info WHERE goods_id = ?', [goods_id]);
        if (goodsRows.length === 0) {
            return res.status(404).json({ code: 404, message: '物品不存在' });
        }

        // 验证物主ID是否正确
        if (goodsRows[0].user_id !== to_user_id) {
            return res.status(400).json({ code: 400, message: '物主ID与物品所有者不匹配' });
        }

        // 验证申请人不能是物主
        if (from_user_id === to_user_id) {
            return res.status(400).json({ code: 400, message: '不能申请自己的物品' });
        }

        // 检查是否已有待处理的交易申请
        const [existingTrades] = await pool.query(
            'SELECT trade_id FROM goods_trade WHERE from_user_id = ? AND goods_id = ? AND trade_status = 1',
            [from_user_id, goods_id]
        );
        if (existingTrades.length > 0) {
            return res.status(400).json({ code: 400, message: '您已有待处理的交易申请，请等待处理' });
        }

        // 插入交易申请
        const [result] = await pool.query(
            `INSERT INTO goods_trade (from_user_id, to_user_id, goods_id, trade_type, exchange_type, addr_id, apply_price, apply_item, apply_desc, trade_status, create_time, handle_time) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [from_user_id, to_user_id, goods_id, trade_type, exchange_type || null, addr_id || null, apply_price || 0.00, apply_item || null, apply_desc || null]
        );

        res.status(201).json({
            code: 200,
            message: '交易申请提交成功',
            data: {
                trade_id: result.insertId
            }
        });
    } catch (err) {
        console.error('提交交易申请失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 判断是否已有交易申请
 * @route GET /trade/get
 */
async function getTrade(req, res) {
    console.log('获取交易申请');
    const { from_user_id, goods_id } = req.query;

    // 验证参数
    if (!from_user_id || !goods_id) {
        return res.status(400).json({ code: 400, message: '申请人ID和物品ID不能为空' });
    }
    try {
        // 查询所有字段
        const [row] = await pool.query(
            'SELECT * FROM goods_trade WHERE from_user_id = ? AND goods_id = ?',
            [from_user_id, goods_id]
        );

        if (row.length === 0) {
            return res.status(404).json({ code: 404, message: '交易申请不存在' });
        }

        res.status(200).json({
            code: 200,
            message: '获取交易申请成功',
            data: row
        });
    } catch (err) {
        console.error('获取交易申请失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 发送消息通知
 * @route POST /user/message
 */
async function sendMessage(req, res) {
    console.log('发送消息通知', req.body);
    const { user_id, msg_type, msg_content, related_id } = req.body;

    // 验证参数
    if (!user_id || !msg_type || !msg_content) {
        return res.status(400).json({ code: 400, message: '接收人ID、消息类型和消息内容不能为空' });
    }

    // 验证消息类型
    if (![1, 2].includes(msg_type)) {
        return res.status(400).json({ code: 400, message: '消息类型必须是1（系统通知）或2（交易通知）' });
    }

    //验证user_id是否存在
    const [userRows] = await pool.query('SELECT user_id FROM user_base WHERE user_id = ?', [user_id]);
    if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 验证消息内容长度
    if (msg_content.length > 500) {
        return res.status(400).json({ code: 400, message: '消息内容不能超过500个字符' });
    }

    try {
        // 插入消息记录
        const [result] = await pool.query(
            `INSERT INTO user_message (user_id, msg_type, msg_content, related_id, is_read, create_time) 
             VALUES (?, ?, ?, ?, 0, NOW())`,
            [user_id, msg_type, msg_content, related_id || null]
        );

        res.status(201).json({
            code: 200,
            message: '消息发送成功',
            data: {
                msg_id: result.insertId
            }
        });
    } catch (err) {
        console.error('发送消息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 发送消息通知
 * @route POST /message/admin/send
 */
async function sendAdminMessage(req, res) {
    console.log('发送管理员消息通知', req.body);
    const { account, type, content } = req.body;

    // 验证参数
    if (!account || !type || !content) {
        return res.status(400).json({ code: 400, message: '发送者账号、消息类型和消息内容不能为空' });
    }

    // 验证消息类型
    if (![1, 2].includes(type)) {
        return res.status(400).json({ code: 400, message: '消息类型必须是1（系统通知）或2（交易通知）' });
    }

    //验证账号是否存在
    let rows;
    if (type === 1) {
        [rows] = await pool.query('SELECT id FROM admin_base WHERE username = ?', [account]);
        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }
    } else {
        [rows] = await pool.query('SELECT user_id FROM user_base WHERE user_account = ?', [account]);
        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }
    }
    const send_id = type === 1 ? rows[0].id : rows[0].user_id;
    console.log('发送者ID:', send_id);

    // 验证消息内容长度
    if (content.length > 500) {
        return res.status(400).json({ code: 400, message: '消息内容不能超过500个字符' });
    }

    try {
        // 插入消息记录
        const [result] = await pool.query(
            `INSERT INTO admin_message (type, send_id, content, is_read, create_time) 
             VALUES (?, ?, ?, 0, NOW())`,
            [type, send_id, content]
        );

        res.status(201).json({
            code: 200,
            message: '消息发送成功',
            data: {
                id: result.insertId
            }
        });
    } catch (err) {
        console.error('发送消息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 处理交易申请（同意/拒绝）
 * @route POST /trade/handle
 */
async function handleTrade(req, res) {
    console.log('处理交易申请', req.body);
    const { trade_id, to_user_id, trade_status } = req.body;

    // 验证参数
    if (!trade_id || !to_user_id || !trade_status) {
        return res.status(400).json({ code: 400, message: '交易ID、物主ID和交易状态不能为空' });
    }

    // 验证交易状态
    // if (![2, 3, 4, 5].includes(trade_status)) {
    //     return res.status(400).json({ code: 400, message: '交易状态必须是2（已同意）、3（已拒绝）、4（已完成）或5（已取消）' });
    // }

    try {
        // 验证交易是否存在且属于该用户
        const [tradeRows] = await pool.query(
            'SELECT trade_id, to_user_id, goods_id, trade_status FROM goods_trade WHERE trade_id = ?',
            [trade_id]
        );
        if (tradeRows.length === 0) {
            return res.status(404).json({ code: 404, message: '交易不存在' });
        }

        let conn = null;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // 如果交易同意，先更新其他交易状态为已售罄，再更新当前交易为已同意
            if (trade_status === 2) {
                // 先更新该商品的其他待处理交易为已售罄（状态6）
                await conn.query(
                    'UPDATE goods_trade SET trade_status = 6, handle_time = NOW() WHERE goods_id = ? AND trade_id != ? AND trade_status = 1',
                    [tradeRows[0].goods_id, trade_id]
                );
                // 更新商品状态为已成交
                await conn.query(
                    'UPDATE goods_info SET goods_status = 2, update_time = NOW() WHERE goods_id = ?',
                    [tradeRows[0].goods_id]
                );
            }

            if (trade_status === 5) {
                // 更新商品状态为已下架
                await conn.query(
                    'UPDATE goods_info SET goods_status = 4, update_time = NOW() WHERE goods_id = ?',
                    [tradeRows[0].goods_id]
                );
            }

            // 更新当前交易状态
            await conn.query(
                'UPDATE goods_trade SET trade_status = ?, handle_time = NOW() WHERE trade_id = ?',
                [trade_status, trade_id]
            );

            await conn.commit();

            res.status(200).json({
                code: 200,
                message: trade_status === 2 ? '交易已同意' : trade_status === 3 ? '交易已拒绝' : '交易已完成',
                data: {
                    trade_id,
                    trade_status
                }
            });
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        } finally {
            if (conn) conn.release();
        }
    } catch (err) {
        console.error('处理交易申请失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取所有交易列表
 * @route GET /trade/list/all
 */
async function getAllTrade(req, res) {
    console.log('获取所有交易列表');

    try {
        const [rows] = await pool.query(
            'SELECT * FROM goods_trade'
        );

        res.status(200).json({
            code: 200,
            message: '获取所有交易列表成功',
            data: rows
        });
    } catch (err) {
        console.error('获取所有交易列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取用户交易列表
 * @route GET /trade/list
 */
async function getTradeList(req, res) {
    console.log('获取用户作为申请人的交易列表', req.query);
    const { user_id } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM goods_trade WHERE from_user_id = ? OR to_user_id = ? ORDER BY create_time DESC',
            [user_id, user_id]
        );

        res.status(200).json({
            code: 200,
            message: '获取交易列表成功',
            data: rows
        });
    } catch (err) {
        console.error('获取交易列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取交易详情
 * @route GET /trade/detail
 */
async function getTradeDetail(req, res) {
    console.log('获取交易详情', req.query);
    const { trade_id } = req.query;

    // 验证参数
    if (!trade_id) {
        return res.status(400).json({ code: 400, message: '交易ID不能为空' });
    }

    try {
        // 查询交易详情
        const [tradeRows] = await pool.query(
            'SELECT * FROM goods_trade WHERE trade_id = ?',
            [trade_id]
        );

        if (tradeRows.length === 0) {
            return res.status(404).json({ code: 404, message: '交易不存在' });
        }

        const trade = tradeRows[0];

        res.status(200).json({
            code: 200,
            message: '获取交易详情成功',
            data: trade
        });
    } catch (err) {
        console.error('获取交易详情失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 后台管理 - 交易统计 =====================
/**
 * 获取交易统计数据
 * @route GET /admin/statistics/trade
 */
async function getTradeStatistics(req, res) {
    console.log('获取交易统计数据');

    try {
        // 今日日期（格式：YYYY-MM-DD）
        const today = new Date().toISOString().split('T')[0];

        // 1. 总交易数
        const [totalResult] = await pool.query('SELECT COUNT(*) as count FROM goods_trade');
        const total = totalResult[0].count;

        // 2. 今日交易数
        const [todayResult] = await pool.query(
            'SELECT COUNT(*) as count FROM goods_trade WHERE DATE(create_time) = ?',
            [today]
        );
        const todayCount = todayResult[0].count;

        // 3. 交易成功率
        const [successResult] = await pool.query('SELECT COUNT(*) as count FROM goods_trade WHERE trade_status = 4');
        const successRate = total > 0 ? Math.round((successResult[0].count / total) * 100) : 0;

        // 4. 交易类型分布
        const [typeResult] = await pool.query(
            'SELECT trade_type, COUNT(*) as count FROM goods_trade GROUP BY trade_type'
        );
        const typeDistribution = {
            buy: 0,  // 购买交易数
            exchange: 0  // 交换交易数
        };
        typeResult.forEach(item => {
            if (item.trade_type === 1) {
                typeDistribution.buy = item.count;
            } else if (item.trade_type === 2) {
                typeDistribution.exchange = item.count;
            }
        });

        // 5. 交易状态分布
        const [statusResult] = await pool.query(
            'SELECT trade_status, COUNT(*) as count FROM goods_trade GROUP BY trade_status'
        );
        const statusDistribution = {
            pending: 0,      // 待处理交易数
            success: 0,      // 成功交易数
            failed: 0,       // 失败交易数
            completed: 0,    // 已完成交易数
            cancelled: 0,    // 已取消交易数
            soldOut: 0       // 已售罄交易数
        };
        statusResult.forEach(item => {
            switch (item.trade_status) {
                case 1:
                    statusDistribution.pending = item.count;
                    break;
                case 2:
                    statusDistribution.success = item.count;
                    break;
                case 3:
                    statusDistribution.failed = item.count;
                    break;
                case 4:
                    statusDistribution.completed = item.count;
                    break;
                case 5:
                    statusDistribution.cancelled = item.count;
                    break;
                case 6:
                    statusDistribution.soldOut = item.count;
                    break;
            }
        });

        // 6. 月度趋势数据
        const [monthlyResult] = await pool.query(
            `SELECT 
                DATE_FORMAT(create_time, '%Y-%m') as month, 
                COUNT(*) as count 
            FROM goods_trade 
            GROUP BY DATE_FORMAT(create_time, '%Y-%m') 
            ORDER BY month DESC 
            LIMIT 6`
        );
        const monthlyTrend = monthlyResult.map(item => ({
            month: item.month,
            count: item.count
        })).reverse(); // 按时间正序排列

        // 组装响应数据
        const tradeStatistic = {
            total,
            today: todayCount,
            successRate,
            typeDistribution,
            statusDistribution,
            monthlyTrend
        };

        res.status(200).json({
            code: 200,
            message: '获取交易统计数据成功',
            data: tradeStatistic
        });
    } catch (err) {
        console.error('获取交易统计数据失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取用户地址列表
 * @route GET /address/list
 */
async function getAddressList(req, res) {
    console.log('获取地址列表', req.query);
    const { user_id } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 查询用户的所有地址
        const [rows] = await pool.query(
            'SELECT * FROM user_address WHERE user_id = ? ORDER BY is_default DESC, create_time DESC',
            [user_id]
        );

        res.status(200).json({
            code: 200,
            message: '获取地址列表成功',
            data: rows
        });
    } catch (err) {
        console.error('获取地址列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 添加地址
 * @route POST /address/add
 */
async function addAddress(req, res) {
    console.log('添加地址', req.body);
    const { user_id, addr_name, addr_phone, addr_detail, is_default } = req.body;

    // 验证参数
    if (!user_id || !addr_name || !addr_phone || !addr_detail) {
        return res.status(400).json({ code: 400, message: '用户ID、收货人姓名、电话和详细地址不能为空' });
    }

    // 验证电话格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(addr_phone)) {
        return res.status(400).json({ code: 400, message: '电话号码格式不正确' });
    }

    try {
        // 开启事务
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 如果设置为默认地址，先将其他地址设为非默认
            if (is_default === 1) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                    [user_id]
                );
            }

            // 插入新地址
            const [result] = await connection.query(
                `INSERT INTO user_address (user_id, addr_name, addr_phone, addr_detail, is_default, create_time) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [user_id, addr_name, addr_phone, addr_detail, is_default || 0]
            );

            // 提交事务
            await connection.commit();
            connection.release();

            res.status(201).json({
                code: 200,
                message: '地址添加成功',
                data: {
                    addr_id: result.insertId
                }
            });
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('添加地址失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 编辑地址
 * @route POST /address/edit
 */
async function editAddress(req, res) {
    console.log('编辑地址', req.body);
    const { addr_id, user_id, addr_name, addr_phone, addr_detail, is_default } = req.body;

    // 验证参数
    if (!addr_id || !user_id || !addr_name || !addr_phone || !addr_detail) {
        return res.status(400).json({ code: 400, message: '地址ID、用户ID、收货人姓名、电话和详细地址不能为空' });
    }

    // 验证电话格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(addr_phone)) {
        return res.status(400).json({ code: 400, message: '电话号码格式不正确' });
    }

    try {
        // 验证地址是否存在且属于该用户
        const [addrRows] = await pool.query(
            'SELECT addr_id FROM user_address WHERE addr_id = ? AND user_id = ?',
            [addr_id, user_id]
        );
        if (addrRows.length === 0) {
            return res.status(404).json({ code: 404, message: '地址不存在或不属于该用户' });
        }

        // 开启事务
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 如果设置为默认地址，先将其他地址设为非默认
            if (is_default === 1) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ? AND addr_id != ?',
                    [user_id, addr_id]
                );
            }

            // 更新地址
            await connection.query(
                `UPDATE user_address SET addr_name = ?, addr_phone = ?, addr_detail = ?, is_default = ? 
                 WHERE addr_id = ? AND user_id = ?`,
                [addr_name, addr_phone, addr_detail, is_default || 0, addr_id, user_id]
            );

            // 提交事务
            await connection.commit();
            connection.release();

            res.status(200).json({
                code: 200,
                message: '地址编辑成功'
            });
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('编辑地址失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 删除地址
 * @route POST /address/delete
 */
async function deleteAddress(req, res) {
    console.log('删除地址', req.body);
    const { addr_id, user_id } = req.body;

    // 验证参数
    if (!addr_id || !user_id) {
        return res.status(400).json({ code: 400, message: '地址ID和用户ID不能为空' });
    }

    try {
        // 验证地址是否存在且属于该用户
        const [addrRows] = await pool.query(
            'SELECT addr_id FROM user_address WHERE addr_id = ? AND user_id = ?',
            [addr_id, user_id]
        );
        if (addrRows.length === 0) {
            return res.status(404).json({ code: 404, message: '地址不存在或不属于该用户' });
        }

        // 删除地址
        await pool.query(
            'DELETE FROM user_address WHERE addr_id = ? AND user_id = ?',
            [addr_id, user_id]
        );

        res.status(200).json({
            code: 200,
            message: '地址删除成功'
        });
    } catch (err) {
        console.error('删除地址失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 设置默认地址
 * @route POST /address/set-default
 */
async function setDefaultAddress(req, res) {
    console.log('设置默认地址', req.body);
    const { addr_id, user_id } = req.body;

    // 验证参数
    if (!addr_id || !user_id) {
        return res.status(400).json({ code: 400, message: '地址ID和用户ID不能为空' });
    }

    try {
        // 验证地址是否存在且属于该用户
        const [addrRows] = await pool.query(
            'SELECT addr_id FROM user_address WHERE addr_id = ? AND user_id = ?',
            [addr_id, user_id]
        );
        if (addrRows.length === 0) {
            return res.status(404).json({ code: 404, message: '地址不存在或不属于该用户' });
        }

        // 开启事务
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 将所有地址设为非默认
            await connection.query(
                'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                [user_id]
            );

            // 将指定地址设为默认
            await connection.query(
                'UPDATE user_address SET is_default = 1 WHERE addr_id = ? AND user_id = ?',
                [addr_id, user_id]
            );

            // 提交事务
            await connection.commit();
            connection.release();

            res.status(200).json({
                code: 200,
                message: '默认地址设置成功'
            });
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('设置默认地址失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 获取商品列表 =====================
/**
 * 获取闲置物品列表
 * @route GET /goods
 */
async function getAllGoods(req, res) {
    console.log('收到查询请求参数:', req.query);
    try {
        // 1. 基础 SQL 语句
        let sql = 'SELECT * FROM goods_info WHERE 1=1';
        const params = [];

        // 2. 动态构建筛选条件
        // 筛选商品名称 (模糊查询)
        if (req.query.name) {
            sql += ' AND goods_name LIKE ?';
            params.push(`%${req.query.name}%`);
        }

        // 筛选用户ID (精确查询)
        if (req.query.user_id) {
            sql += ' AND user_id = ?';
            params.push(req.query.user_id);
        }

        // 筛选状态 (精确查询)
        // 注意：0 在 JS 中是假值，需要特殊处理
        if (req.query.status !== undefined && req.query.status !== '') {
            sql += ' AND goods_status = ?';
            params.push(req.query.status);
        }

        // 筛选分类ID (精确查询)
        if (req.query.cate_id && req.query.cate_id > 0) {
            sql += ' AND cate_id = ?';
            params.push(req.query.cate_id);
        }

        // 3. 排序 (按创建时间倒序)
        sql += ' ORDER BY create_time DESC';

        // 4. 执行查询
        const [rows] = await pool.query(sql, params);

        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('商品查询失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取物品信息
 * @route GET /goods/info
 */
async function getGoodsInfo(req, res) {
    console.log('获取物品信息');
    const { goods_id } = req.query;

    // 验证参数
    if (!goods_id) {
        return res.status(400).json({ code: 400, message: '物品ID不能为空' });
    }

    try {
        // 查询所有字段
        const [row] = await pool.query(
            'SELECT * FROM goods_info WHERE goods_id = ?',
            [goods_id]
        );

        if (row.length === 0) {
            return res.status(404).json({ code: 404, message: '物品不存在' });
        }

        res.status(200).json({
            code: 200,
            message: '获取物品信息成功',
            data: row[0]
        });
    } catch (err) {
        console.error('获取物品信息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 商品分类管理 =====================
/**
 * 获取分类列表
 * @route GET /Tags
 */
async function getAllCate(req, res) {
    console.log('获取分类列表');
    try {
        const [rows] = await pool.query('SELECT * FROM goods_category');
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 500, message: 'Internal server error' });

    }
}

/**
 * 添加商品分类
 * @route POST /goodsCate/add
 */
async function addGoodsCategory(req, res) {
    console.log('添加商品分类', req.body);
    const { cate_name } = req.body;

    // 验证参数
    if (!cate_name) {
        return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    }

    try {
        // 检查分类名称是否已存在
        const [existingCate] = await pool.query(
            'SELECT cate_id FROM goods_category WHERE cate_name = ?',
            [cate_name]
        );

        if (existingCate.length > 0) {
            return res.status(409).json({ code: 409, message: '分类名称已存在' });
        }

        // 插入分类
        const [result] = await pool.query(
            'INSERT INTO goods_category (cate_name) VALUES (?)',
            [cate_name]
        );

        res.status(201).json({
            code: 200,
            message: '分类添加成功',
            data: {
                cate_id: result.insertId,
                cate_name,
            }
        });
    } catch (err) {
        console.error('添加分类失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 编辑商品分类
 * @route POST /goodsCate/edit
 */
async function editGoodsCategory(req, res) {
    console.log('编辑商品分类', req.body);
    const { cate_id, cate_name } = req.body;

    // 验证参数
    if (!cate_id || !cate_name) {
        return res.status(400).json({ code: 400, message: '分类ID和分类名称不能为空' });
    }

    try {
        // 检查分类是否存在
        const [existingCate] = await pool.query(
            'SELECT cate_id FROM goods_category WHERE cate_id = ?',
            [cate_id]
        );

        if (existingCate.length === 0) {
            return res.status(404).json({ code: 404, message: '分类不存在' });
        }

        // 检查分类名称是否已被其他分类使用
        const [nameCheck] = await pool.query(
            'SELECT cate_id FROM goods_category WHERE cate_name = ? AND cate_id != ?',
            [cate_name, cate_id]
        );

        if (nameCheck.length > 0) {
            return res.status(409).json({ code: 409, message: '分类名称已存在' });
        }

        // 更新分类
        await pool.query(
            'UPDATE goods_category SET cate_name = ? WHERE cate_id = ?',
            [cate_name, cate_id]
        );

        res.status(200).json({
            code: 200,
            message: '分类编辑成功',
            data: {
                cate_id,
                cate_name,
            }
        });
    } catch (err) {
        console.error('编辑分类失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 删除商品分类
 * @route POST /goodsCate/delete
 */
async function deleteGoodsCategory(req, res) {
    console.log('删除商品分类', req.body);
    const { cate_id } = req.body;

    // 验证参数
    if (!cate_id) {
        return res.status(400).json({ code: 400, message: '分类ID不能为空' });
    }

    try {
        // 检查分类是否存在
        const [existingCate] = await pool.query(
            'SELECT cate_id FROM goods_category WHERE cate_id = ?',
            [cate_id]
        );

        if (existingCate.length === 0) {
            return res.status(404).json({ code: 404, message: '分类不存在' });
        }

        // 检查是否有商品使用该分类
        const [goodsCount] = await pool.query(
            'SELECT COUNT(*) as count FROM goods_info WHERE cate_id = ?',
            [cate_id]
        );

        if (goodsCount[0].count > 0) {
            return res.status(400).json({ code: 400, message: '该分类下有商品，无法删除' });
        }

        // 删除分类
        await pool.query('DELETE FROM goods_category WHERE cate_id = ?', [cate_id]);

        res.status(200).json({
            code: 200,
            message: '分类删除成功',
            data: {
                cate_id
            }
        });
    } catch (err) {
        console.error('删除分类失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 公告管理 =====================
/**
 * 获取公告列表
 * @route GET /notice
 */
async function getAllNotice(req, res) {
    console.log('获取公告列表');
    try {
        const [rows] = await pool.query('SELECT * FROM system_notice ORDER BY is_top DESC');
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 500, message: 'Internal server error' });

    }
}

/**
 * 添加公告
 * @route POST /notice/add
 */
async function addNotice(req, res) {
    console.log('添加公告', req.body);
    const { notice_title, notice_content, is_top, is_show } = req.body;

    // 验证参数
    if (!notice_title || !notice_content) {
        return res.status(400).json({ code: 400, message: '公告标题和内容不能为空' });
    }

    try {
        // 如果设置为置顶，先将其他公告取消置顶
        if (is_top === 1) {
            await pool.query('UPDATE system_notice SET is_top = 0');
        }

        // 插入公告
        const [result] = await pool.query(
            'INSERT INTO system_notice (notice_title, notice_content, is_top, is_show, create_time) VALUES (?, ?, ?, ?, NOW())',
            [notice_title, notice_content, is_top, is_show, is_show || 0]
        );

        res.status(201).json({
            code: 200,
            message: '公告添加成功',
            data: {
                notice_id: result.insertId,
                notice_title,
                notice_content,
                is_top: is_top,
                is_show: is_show
            }
        });
    } catch (err) {
        console.error('添加公告失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 编辑公告
 * @route POST /notice/edit
 */
async function editNotice(req, res) {
    console.log('编辑公告', req.body);
    const { notice_id, notice_title, notice_content, is_top, is_show } = req.body;

    // 验证参数
    if (!notice_id || !notice_title || !notice_content) {
        return res.status(400).json({ code: 400, message: '公告ID、标题和内容不能为空' });
    }

    try {
        // 检查公告是否存在
        const [existingNotice] = await pool.query(
            'SELECT notice_id FROM system_notice WHERE notice_id = ?',
            [notice_id]
        );

        if (existingNotice.length === 0) {
            return res.status(404).json({ code: 404, message: '公告不存在' });
        }

        // 如果设置为置顶，先将其他公告取消置顶
        if (is_top === 1) {
            await pool.query('UPDATE system_notice SET is_top = 0 WHERE notice_id != ?', [notice_id]);
        }

        // 更新公告
        await pool.query(
            'UPDATE system_notice SET notice_title = ?, notice_content = ?, is_top = ?, is_show = ? WHERE notice_id = ?',
            [notice_title, notice_content, is_top, is_show, notice_id]
        )

        res.status(200).json({
            code: 200,
            message: '公告编辑成功',
            data: {
                notice_id,
                notice_title,
                notice_content,
                is_top: is_top,
                is_show: is_show
            }
        });
    } catch (err) {
        console.error('编辑公告失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 删除公告
 * @route POST /notice/delete
 */
async function deleteNotice(req, res) {
    console.log('删除公告', req.body);
    const { notice_id } = req.body;

    // 验证参数
    if (!notice_id) {
        return res.status(400).json({ code: 400, message: '公告ID不能为空' });
    }

    try {
        // 检查公告是否存在
        const [existingNotice] = await pool.query(
            'SELECT notice_id FROM system_notice WHERE notice_id = ?',
            [notice_id]
        );

        if (existingNotice.length === 0) {
            return res.status(404).json({ code: 404, message: '公告不存在' });
        }

        // 删除公告
        await pool.query('DELETE FROM system_notice WHERE notice_id = ?', [notice_id]);

        res.status(200).json({
            code: 200,
            message: '公告删除成功',
            data: {
                notice_id
            }
        });
    } catch (err) {
        console.error('删除公告失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 置顶公告
 * @route POST /notice/top
 */
async function topNotice(req, res) {
    console.log('置顶公告', req.body);
    const { notice_id } = req.body;

    // 验证参数
    if (!notice_id) {
        return res.status(400).json({ code: 400, message: '公告ID不能为空' });
    }

    try {
        // 检查公告是否存在
        const [existingNotice] = await pool.query(
            'SELECT notice_id FROM system_notice WHERE notice_id = ?',
            [notice_id]
        );

        if (existingNotice.length === 0) {
            return res.status(404).json({ code: 404, message: '公告不存在' });
        }

        // 先将所有公告取消置顶
        await pool.query('UPDATE system_notice SET is_top = 0');

        // 将指定公告置顶
        await pool.query('UPDATE system_notice SET is_top = 1 WHERE notice_id = ?', [notice_id]);

        res.status(200).json({
            code: 200,
            message: '公告置顶成功',
            data: {
                notice_id
            }
        });
    } catch (err) {
        console.error('置顶公告失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 增加浏览量 =====================
/**
 * 增加商品浏览量
 * @route GET /goods/view
 * @query {number} goods_id 商品ID（必填）
 */
async function incrementBrowseCount(req, res) {
    console.log('增加商品浏览量，商品ID:', req.query.goods_id);
    const { goods_id } = req.query;

    // 验证参数
    if (!goods_id) {
        return res.status(400).json({ code: 400, message: '商品ID不能为空' });
    }

    try {
        // 更新浏览量
        const [result] = await pool.query(
            'UPDATE goods_info SET browse_count = browse_count + 1 WHERE goods_id = ?',
            [goods_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 404, message: '商品不存在' });
        }

        // 获取更新后的商品信息
        const [rows] = await pool.query(
            'SELECT * FROM goods_info WHERE goods_id = ?',
            [goods_id]
        );

        res.status(200).json({
            code: 200,
            message: '浏览量更新成功',
            data: rows[0]
        });
    } catch (err) {
        console.error('更新浏览量失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 获取商品详情 =====================
/**
 * 获取商品详情
 * @route GET /goods/detail
 * @query {number} goods_id 商品ID（必填）
 */
async function getGoodsDetail(req, res) {
    console.log('获取商品详情，商品ID:', req.query.goods_id);
    const { goods_id } = req.query;

    // 验证参数
    if (!goods_id) {
        return res.status(400).json({ code: 400, message: '商品ID不能为空' });
    }

    try {
        // 获取商品信息
        const [goods] = await pool.query(
            'SELECT * FROM goods_info WHERE goods_id = ?',
            [goods_id]
        );

        if (goods.length === 0) {
            return res.status(404).json({ code: 404, message: '商品不存在' });
        }

        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: {
                goods: goods[0],
            }
        });
    } catch (err) {
        console.error('获取商品详情失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 获取我的闲置物品 =====================
/**
 * 获取我的闲置物品列表
 * @route GET /goods/my
 * @query {number} user_id 用户ID（必填）
 * @query {number} [goods_status] 物品状态：1-上架，2-已成交，3-审核中
 */
async function getMyGoods(req, res) {
    console.log('获取我的闲置物品，用户ID:', req.query.user_id);
    const { user_id, goods_status } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        let sql = 'SELECT * FROM goods_info WHERE user_id = ?';
        const params = [user_id];

        // 如果传入状态，添加筛选条件
        if (goods_status) {
            sql += ' AND goods_status = ?';
            params.push(goods_status);
        }

        sql += ' ORDER BY create_time DESC';

        const [rows] = await pool.query(sql, params);
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('获取我的闲置物品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 获取附近闲置物品 =====================
/**
 * 获取附近闲置物品列表
 * @route GET /goods/nearby
 * @query {number} lng 经度（必填）
 * @query {number} lat 纬度（必填）
 * @query {number} [radius] 搜索半径（公里，默认10）
 */
async function getNearbyGoods(req, res) {
    console.log('获取附近闲置物品');
    const { lng, lat, radius = 10 } = req.query;

    // 验证参数
    if (!lng || !lat) {
        return res.status(400).json({ code: 400, message: '经纬度不能为空' });
    }

    try {
        // 使用 Haversine 公式计算距离
        const sql = `
            SELECT *, 
            (6371 * acos(cos(radians(?)) * cos(radians(goods_lat)) * 
            cos(radians(goods_lng) - radians(?)) + 
            sin(radians(?)) * sin(radians(goods_lat)))) AS distance 
            FROM goods_info 
            WHERE goods_status = 1 
            HAVING distance < ? 
            ORDER BY distance ASC
        `;

        const [rows] = await pool.query(sql, [lat, lng, lat, radius]);
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('获取附近闲置物品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 新增闲置物品 =====================
/**
 * 新增闲置物品
 * @route POST /goods/add
 */
async function addGoods(req, res) {
    console.log('新增闲置物品', req.body);

    const {
        user_id,
        cate_id,
        goods_name,
        goods_desc,
        goods_pic,
        goods_new_level,
        goods_type,
        goods_price,
        exchange_want,
        goods_lng,
        goods_lat,
        goods_stock
    } = req.body;

    // 验证必填参数
    if (!user_id || !cate_id || !goods_name ||
        !goods_new_level || !goods_type || !goods_lng || !goods_lat) {
        return res.status(400).json({ code: 400, message: '缺少必填参数' });
    }

    // 验证商品类型和价格
    if (goods_type === 2 && !goods_price) {
        return res.status(400).json({ code: 400, message: '售卖商品必须设置价格' });
    }

    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. 插入闲置物品记录
        const [goodsResult] = await conn.query(
            `INSERT INTO goods_info 
            (user_id, cate_id, goods_name, goods_desc, goods_pic, goods_new_level, 
             goods_type, goods_price, exchange_want, goods_lng, goods_lat, 
             browse_count, goods_stock, goods_status, create_time, update_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 3, NOW(), NOW())`,
            [user_id, cate_id, goods_name, goods_desc, goods_pic, goods_new_level,
                goods_type, goods_price || 0, exchange_want, goods_lng, goods_lat, goods_stock || 1]
        );

        const goods_id = goodsResult.insertId;

        // 2. 插入审核记录
        const [auditResult] = await conn.query(
            `INSERT INTO goods_audit 
            (goods_id, audit_status, create_time, update_time) 
            VALUES (?, 1, NOW(), NOW())`,
            [goods_id]
        );

        await conn.commit();

        res.status(200).json({
            code: 200,
            message: '闲置物品发布成功，等待审核',
            data: {
                goods_id,
                audit_id: auditResult.insertId
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('新增闲置物品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
}

// ===================== 编辑闲置物品 =====================
/**
 * 编辑闲置物品
 * @route POST /goods/edit
 */
async function editGoods(req, res) {
    console.log('编辑闲置物品');

    const {
        goods_id,
        user_id,
        cate_id,
        goods_name,
        goods_desc,
        goods_pic,
        goods_new_level,
        goods_type,
        goods_price,
        exchange_want,
        goods_lng,
        goods_lat,
        goods_status,
        goods_stock
    } = req.body;

    // 验证必填参数
    if (!goods_id || !user_id) {
        return res.status(400).json({ code: 400, message: '商品ID和用户ID不能为空' });
    }

    // 验证商品类型和价格
    if (goods_type === 2 && !goods_price) {
        return res.status(400).json({ code: 400, message: '售卖商品必须设置价格' });
    }

    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. 检查商品是否存在且属于该用户
        const [checkResult] = await conn.query(
            'SELECT goods_id FROM goods_info WHERE goods_id = ? AND user_id = ?',
            [goods_id, user_id]
        );

        if (checkResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({ code: 404, message: '商品不存在或无权限编辑' });
        }

        // 2. 更新商品信息
        const [updateResult] = await conn.query(
            `UPDATE goods_info SET 
            cate_id = ?, goods_name = ?, goods_desc = ?, goods_pic = ?, 
            goods_new_level = ?, goods_type = ?, goods_price = ?, 
            exchange_want = ?, goods_lng = ?, goods_lat = ?, 
            goods_stock = ?, goods_status = ?, update_time = NOW() 
            WHERE goods_id = ?`,
            [cate_id, goods_name, goods_desc, goods_pic, goods_new_level,
                goods_type, goods_price || 0, exchange_want, goods_lng, goods_lat,
                goods_stock || 1, goods_status, goods_id]
        );

        // 3. 如果修改了状态，更新审核记录
        if (goods_status === 3) {
            await conn.query(
                `UPDATE goods_audit SET 
                audit_status = 1, audit_time = NULL, 
                reject_reason = NULL, update_time = NOW() 
                WHERE goods_id = ?`,
                [goods_id]
            );
        }

        await conn.commit();

        res.status(200).json({
            code: 200,
            message: '闲置物品更新成功',
            data: {
                goods_id,
                affectedRows: updateResult.affectedRows
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('编辑闲置物品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
}

// ===================== 删除闲置物品 =====================
/**
 * 删除闲置物品
 * @route POST /goods/delete
 */
async function deleteGoods(req, res) {
    console.log('删除闲置物品');

    const { goods_id, user_id } = req.body;

    // 验证必填参数
    if (!goods_id || !user_id) {
        return res.status(400).json({ code: 400, message: '商品ID和用户ID不能为空' });
    }

    let conn = null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. 检查商品是否存在且属于该用户
        const [checkResult] = await conn.query(
            'SELECT goods_id FROM goods_info WHERE goods_id = ? AND user_id = ?',
            [goods_id, user_id]
        );

        if (checkResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({ code: 404, message: '商品不存在或无权限删除' });
        }

        // 2. 删除审核记录
        await conn.query(
            'DELETE FROM goods_audit WHERE goods_id = ?',
            [goods_id]
        );

        // 3. 删除商品记录
        const [deleteResult] = await conn.query(
            'DELETE FROM goods_info WHERE goods_id = ?',
            [goods_id]
        );

        await conn.commit();

        res.status(200).json({
            code: 200,
            message: '闲置物品删除成功',
            data: {
                goods_id,
                affectedRows: deleteResult.affectedRows
            }
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('删除闲置物品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
}

// ===================== 消息相关接口 =====================
/**
 * 获取消息列表
 * @route GET /messages
 * @query {number} user_id 用户ID（必填）
 */
async function getMessages(req, res) {
    console.log('获取消息列表，用户ID:', req.query.user_id);
    const { user_id } = req.query;

    try {
        let sql = 'SELECT * FROM user_message';
        const params = [];
        if (user_id) {
            sql += ' WHERE user_id = ? ORDER BY create_time DESC';
            params.push(user_id);
        } else {
            sql += ' ORDER BY create_time DESC';
        }

        const [rows] = await pool.query(sql, params);
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('获取消息列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取消息列表
 * @route GET /messages/admin
 * @query {number} user_id 用户ID（必填）
 */
async function getAdminMessages(req, res) {
    console.log('获取管理员消息列表');

    try {
        let sql = 'SELECT * FROM admin_message';
        const params = [];

        const [rows] = await pool.query(sql, params);
        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('获取管理员消息列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 标记消息为已读 =====================
/**
 * 标记消息为已读
 * @route POST /messages/read
 */
async function markMessageAsRead(req, res) {
    console.log('标记消息为已读');
    const { msg_id, user_id } = req.body;

    // 验证参数
    if (!msg_id || !user_id) {
        return res.status(400).json({ code: 400, message: '消息ID和用户ID不能为空' });
    }

    try {
        // 检查消息是否存在且属于该用户
        const [checkResult] = await pool.query(
            'SELECT msg_id FROM user_message WHERE msg_id = ? AND user_id = ?',
            [msg_id, user_id]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ code: 404, message: '消息不存在或无权限操作' });
        }

        // 标记为已读
        const [result] = await pool.query(
            'UPDATE user_message SET is_read = 1 WHERE msg_id = ?',
            [msg_id]
        );

        res.status(200).json({
            code: 200,
            message: '消息已标记为已读',
            data: {
                msg_id,
                affectedRows: result.affectedRows
            }
        });
    } catch (err) {
        console.error('标记消息为已读失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 标记消息为已读
 * @route POST /messages/read
 */
async function markAdminMessageAsRead(req, res) {
    console.log('标记管理员消息为已读');
    const { id } = req.body;

    try {
        // 检查消息是否存在且属于该用户
        const [checkResult] = await pool.query(
            'SELECT id FROM admin_message WHERE id = ?',
            [id]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ code: 404, message: '消息不存在或无权限操作' });
        }

        // 标记为已读
        const [result] = await pool.query(
            'UPDATE admin_message SET is_read = 1 WHERE id = ?',
            [id]
        );

        res.status(200).json({
            code: 200,
            message: '消息已标记为已读',
            data: {
                id,
                affectedRows: result.affectedRows
            }
        });
    } catch (err) {
        console.error('标记管理员消息为已读失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 删除消息 =====================
/**
 * 删除消息
 * @route POST /messages/delete
 */
async function deleteMessage(req, res) {
    console.log('删除消息');
    const { msg_id, user_id } = req.body;

    // 验证参数
    if (!msg_id || !user_id) {
        return res.status(400).json({ code: 400, message: '消息ID和用户ID不能为空' });
    }

    try {
        // 检查消息是否存在且属于该用户
        const [checkResult] = await pool.query(
            'SELECT msg_id FROM user_message WHERE msg_id = ? AND user_id = ?',
            [msg_id, user_id]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ code: 404, message: '消息不存在或无权限删除' });
        }

        // 删除消息
        const [result] = await pool.query(
            'DELETE FROM user_message WHERE msg_id = ?',
            [msg_id]
        );

        res.status(200).json({
            code: 200,
            message: '消息删除成功',
            data: {
                msg_id,
                affectedRows: result.affectedRows
            }
        });
    } catch (err) {
        console.error('删除消息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 聊天相关接口 =====================

// ===================== 获取聊天列表 =====================
/**
 * 获取聊天列表
 * @route GET /chat/list
 * @query {number} user_id 用户ID（必填）
 */
async function getChatList(req, res) {
    console.log('获取聊天列表，用户ID:', req.query.user_id);
    const { user_id } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 获取与该用户有聊天记录的用户列表
        const [rows] = await pool.query(
            `SELECT * FROM chat_record 
            WHERE from_user_id = ? OR to_user_id = ? ORDER BY create_time DESC`,
            [user_id, user_id]
        );

        res.status(200).json({
            code: 200,
            message: '获取成功',
            data: rows
        });
    } catch (err) {
        console.error('获取聊天列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 发送聊天消息 =====================
/**
 * 发送聊天消息
 * @route POST /chat/send
 */
async function sendChatMessage(req, res) {
    console.log('发送聊天消息');
    const {
        goods_id,
        from_user_id,
        to_user_id,
        chat_content,
        chat_type
    } = req.body;

    // 验证参数
    if (!goods_id || !from_user_id || !to_user_id || !chat_content || !chat_type) {
        return res.status(400).json({ code: 400, message: '商品ID、发送人ID、接收人ID、消息内容和消息类型不能为空' });
    }

    try {
        // 插入聊天记录
        const [result] = await pool.query(
            `INSERT INTO chat_record 
            (goods_id, from_user_id, to_user_id, chat_content, chat_type, is_read, create_time) 
            VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [goods_id, from_user_id, to_user_id, chat_content, chat_type]
        );

        res.status(201).json({
            code: 200,
            message: '消息发送成功',
            data: {
                chat_id: result.insertId
            }
        });
    } catch (err) {
        console.error('发送聊天消息失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 标记聊天消息为已读 =====================
/**
 * 标记聊天消息为已读
 * @route POST /chat/read
 */
async function markChatAsRead(req, res) {
    console.log('标记聊天消息为已读', req.body);
    const { from_user_id, to_user_id } = req.body;

    // 验证参数
    if (!from_user_id || !to_user_id) {
        return res.status(400).json({ code: 400, message: '发送人ID和接收人ID不能为空' });
    }

    try {
        // 标记对方发送的消息为已读
        const [result] = await pool.query(
            'UPDATE chat_record SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ? AND is_read = 0',
            [from_user_id, to_user_id]
        );

        res.status(200).json({
            code: 200,
            message: '消息已标记为已读',
            data: {
                affectedRows: result.affectedRows
            }
        });
    } catch (err) {
        console.error('标记聊天消息为已读失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 标记所有消息为已读
 * @route POST /all/read
 */
async function markAllAsRead(req, res) {
    console.log('标记所有消息为已读');
    const { user_id } = req.body;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 标记聊天记录为已读
        const [chatResult] = await pool.query(
            'UPDATE chat_record SET is_read = 1 WHERE to_user_id = ? AND is_read = 0',
            [user_id]
        );

        // 标记用户消息为已读
        const [messageResult] = await pool.query(
            'UPDATE user_message SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [user_id]
        );

        res.status(200).json({
            code: 200,
            message: '消息已标记为已读',
            data: {
                chat_affectedRows: chatResult.affectedRows,
                message_affectedRows: messageResult.affectedRows,
                total_affectedRows: chatResult.affectedRows + messageResult.affectedRows
            }
        });
    } catch (err) {
        console.error('标记所有消息为已读失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}


/**
 * 获取用户收藏列表
 * @route GET /collect
 */
async function getUserCollect(req, res) {
    console.log('获取用户收藏列表', req.query);
    const { user_id } = req.query;

    // 验证参数
    if (!user_id) {
        return res.status(400).json({ code: 400, message: '用户ID不能为空' });
    }

    try {
        // 查询所有字段
        const [row] = await pool.query(
            'SELECT * FROM goods_collect WHERE user_id = ?',
            [user_id]
        );

        if (row.length === 0) {
            return res.status(404).json({ code: 404, message: '用户收藏列表为空' });
        }

        res.status(200).json({
            code: 200,
            message: '获取用户收藏列表成功',
            data: row
        });
    } catch (err) {
        console.error('获取用户收藏列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 新增收藏
 * @route POST /collect/add
 */
async function addCollect(req, res) {
    console.log('新增收藏', req.body);
    const { user_id, goods_id } = req.body;

    // 验证参数
    if (!user_id || !goods_id) {
        return res.status(400).json({ code: 400, message: '用户ID和商品ID不能为空' });
    }

    try {
        // 插入收藏记录
        const [result] = await pool.query(
            'INSERT INTO goods_collect (user_id, goods_id) VALUES (?, ?)',
            [user_id, goods_id]
        );

        res.status(201).json({
            code: 200,
            message: '收藏已新增',
            data: {
                collect_id: result.insertId
            }
        });
    } catch (err) {
        console.error('新增收藏失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 取消收藏
 * @route POST /collect/delete
 */
async function deleteCollect(req, res) {
    console.log('取消收藏', req.body);
    const { user_id, goods_id } = req.body;

    // 验证参数
    if (!user_id || !goods_id) {
        return res.status(400).json({ code: 400, message: '用户ID和商品ID不能为空' });
    }

    try {
        // 删除收藏记录
        const [result] = await pool.query(
            'DELETE FROM goods_collect WHERE user_id = ? AND goods_id = ?',
            [user_id, goods_id]
        );

        res.status(201).json({
            code: 200,
            message: '收藏已取消',
            data: {
                affectedRows: result.affectedRows
            }
        });
    } catch (err) {
        console.error('取消收藏失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 后台管理统计 =====================
/**
 * 获取概览统计数据
 * @route GET /admin/statistics/overview
 */
async function getOverviewStatistics(req, res) {
    console.log('获取概览统计数据');

    try {
        // 今日日期（格式：YYYY-MM-DD）
        const today = new Date().toISOString().split('T')[0];

        // 1. 用户统计
        const [userTotal] = await pool.query('SELECT COUNT(*) as count FROM user_base');
        const [userToday] = await pool.query(
            'SELECT COUNT(*) as count FROM user_base WHERE DATE(create_time) = ?',
            [today]
        );
        // 活跃用户：最近7天有登录或操作的用户（这里简化为所有用户，实际应该根据登录记录判断）
        const [userActive] = await pool.query('SELECT COUNT(*) as count FROM user_base WHERE user_status = 0');

        // 2. 商品统计
        const [goodsTotal] = await pool.query('SELECT COUNT(*) as count FROM goods_info');
        const [goodsPending] = await pool.query('SELECT COUNT(*) as count FROM goods_info WHERE goods_status = 3');
        const [goodsOnline] = await pool.query('SELECT COUNT(*) as count FROM goods_info WHERE goods_status = 1');
        const [goodsOffline] = await pool.query('SELECT COUNT(*) as count FROM goods_info WHERE goods_status = 4');

        // 3. 交易统计
        const [tradeTotal] = await pool.query('SELECT COUNT(*) as count FROM goods_trade');
        const [tradeToday] = await pool.query(
            'SELECT COUNT(*) as count FROM goods_trade WHERE DATE(create_time) = ?',
            [today]
        );
        const [tradeSuccess] = await pool.query('SELECT COUNT(*) as count FROM goods_trade WHERE trade_status = 4');
        const successRate = tradeTotal[0].count > 0
            ? Math.round((tradeSuccess[0].count / tradeTotal[0].count) * 100)
            : 0;

        // 4. 互动统计
        const [collectCount] = await pool.query('SELECT COUNT(*) as count FROM goods_collect');
        const [messageCount] = await pool.query('SELECT COUNT(*) as count FROM user_message');

        // 组装响应数据
        const overviewData = {
            user: {
                total: userTotal[0].count,
                today: userToday[0].count,
                active: userActive[0].count
            },
            goods: {
                total: goodsTotal[0].count,
                pending: goodsPending[0].count,
                online: goodsOnline[0].count,
                offline: goodsOffline[0].count
            },
            trade: {
                total: tradeTotal[0].count,
                today: tradeToday[0].count,
                successRate: successRate
            },
            interaction: {
                collect: collectCount[0].count,
                message: messageCount[0].count
            }
        };

        res.status(200).json({
            code: 200,
            message: '获取概览统计数据成功',
            data: overviewData
        });
    } catch (err) {
        console.error('获取概览统计数据失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 获取趋势统计数据 (用户增长、商品发布、交易量)
 * @route GET /admin/statistics/trend?days=7
 */
async function getTrendStatistics(req, res) {
    console.log('获取趋势统计数据');
    try {
        const days = parseInt(req.query.days) || 7;

        // 1. 生成最近 N 天的日期列表 (用于保证数据连续性)
        const dateList = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dateList.push(date.toISOString().split('T')[0]);
        }

        // 2. 查询用户增长趋势 (基于 user_base.create_time)
        const [userRows] = await pool.query(`
      SELECT DATE(create_time) as date, COUNT(*) as count 
      FROM user_base 
      WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(create_time)
      ORDER BY date ASC
    `, [days]);

        // 3. 查询商品发布趋势 (基于 goods_info.create_time)
        const [goodsRows] = await pool.query(`
      SELECT DATE(create_time) as date, COUNT(*) as count 
      FROM goods_info 
      WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(create_time)
      ORDER BY date ASC
    `, [days]);

        // 4. 查询交易量趋势 (基于 goods_trade.create_time)
        const [tradeRows] = await pool.query(`
      SELECT DATE(create_time) as date, COUNT(*) as count 
      FROM goods_trade 
      WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(create_time)
      ORDER BY date ASC
    `, [days]);

        // 5. 格式化数据，补全缺失日期的 0 值
        const formatTrend = (rows) => {
            const map = new Map(rows.map(r => [r.date.toISOString().split('T')[0], r.count]));
            return dateList.map(date => ({
                date: date.substring(5), // 只保留 MM-DD 格式供前端显示
                count: map.get(date) || 0
            }));
        };

        res.send({
            code: 200,
            message: '获取成功',
            data: {
                userTrend: formatTrend(userRows),
                goodsTrend: formatTrend(goodsRows),
                tradeTrend: formatTrend(tradeRows)
            }
        });

    } catch (error) {
        console.error('统计数据查询失败:', error);
        res.status(500).send({
            code: 500,
            message: '服务器内部错误'
        });
    }
}

// ===================== 后台管理 - 商品审核 =====================
/**
 * 获取待审核商品列表
 * @route GET /admin/goods/pending
 */
async function getPendingGoods(req, res) {
    console.log('获取待审核商品列表');

    try {
        // 查询待审核的商品（goods_status = 3）
        const [rows] = await pool.query(
            `SELECT g.*, u.user_account, u.user_nickname 
             FROM goods_info g 
             LEFT JOIN user_base u ON g.user_id = u.user_id 
             WHERE g.goods_status = 3 
             ORDER BY g.create_time DESC`
        );

        res.status(200).json({
            code: 200,
            message: '获取待审核商品列表成功',
            data: rows
        });
    } catch (err) {
        console.error('获取待审核商品列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 审核商品
 * @route POST /admin/goods/audit
 */
async function auditGoods(req, res) {
    console.log('审核商品', req.body);
    const { goods_id, audit_status, reject_reason } = req.body;

    // 验证参数
    if (!goods_id || !audit_status) {
        return res.status(400).json({ code: 400, message: '商品ID和审核状态不能为空' });
    }

    // 验证审核状态
    if (![2, 3].includes(audit_status)) {
        return res.status(400).json({ code: 400, message: '审核状态必须是2（通过）或3（驳回）' });
    }

    try {
        // 验证商品是否存在且状态为待审核
        const [goodsRows] = await pool.query(
            'SELECT goods_id, goods_status FROM goods_info WHERE goods_id = ?',
            [goods_id]
        );

        if (goodsRows.length === 0) {
            return res.status(404).json({ code: 404, message: '商品不存在' });
        }

        if (goodsRows[0].goods_status !== 3) {
            return res.status(400).json({ code: 400, message: '商品不是待审核状态' });
        }

        let conn = null;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // 1. 更新商品状态
            await conn.query(
                'UPDATE goods_info SET goods_status = ?, update_time = NOW() WHERE goods_id = ?',
                [audit_status === 2 ? 1 : 5, goods_id]//物品状态：1-上架，2-已成交，3-审核中，4-已取消，5-审核不通过
            );

            // 2. 更新审核记录
            await conn.query(
                'UPDATE goods_audit SET audit_status = ?, reject_reason = ?, audit_time = NOW() WHERE goods_id = ?',
                [audit_status, reject_reason || null, goods_id]
            );

            await conn.commit();

            res.status(200).json({
                code: 200,
                message: audit_status === 2 ? '商品审核通过' : '商品审核拒绝',
                data: {
                    goods_id,
                    audit_status
                }
            });
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        } finally {
            if (conn) conn.release();
        }
    } catch (err) {
        console.error('审核商品失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 禁用管理员 
 * @route POST /admin/ban 
 */
async function banAdmin(req, res) {
    console.log('管理员状态改变', req.body);
    const { id, status } = req.body;

    if (id === undefined || id === null || id === '') {
        return res.status(400).json({ code: 400, message: '管理员ID不能为空' });
    }
    if (status === undefined || status === null || status === '') {
        return res.status(400).json({ code: 400, message: '管理员状态不能为空' });
    }

    const parsedStatus = Number(status);
    if (!Number.isInteger(parsedStatus) || ![1, 2].includes(parsedStatus)) {
        return res.status(400).json({ code: 400, message: '管理员状态必须是1（正常）或2（禁用）' });
    }

    try {
        const [adminRows] = await pool.query(
            'SELECT id, status FROM admin_base WHERE id = ?',
            [id]
        );

        if (adminRows.length === 0) {
            return res.status(404).json({ code: 404, message: '管理员不存在' });
        }

        await pool.query(
            'UPDATE admin_base SET status = ?, updated_time = NOW() WHERE id = ?',
            [parsedStatus, id]
        );

        res.status(200).json({
            code: 200,
            message: parsedStatus === 1 ? '管理员已封禁' : '管理员已解封',
            data: { id, status: parsedStatus }
        });
    } catch (err) {
        console.error('封禁管理员失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

// ===================== 商品评论相关接口 =====================

/** 
 * 获取商品评论列表 
 * @route GET /comment/list 
 */
async function getCommentList(req, res) {
    const { goods_id } = req.query;

    // if (!goods_id) {
    //     return res.status(400).json({ code: 400, message: '商品ID不能为空' });
    // }

    try {
        let comments = [];
        // 查询该商品下所有正常显示的评论（status = 1）
        // 包含用户信息
        if (goods_id) {
            const [rows] = await pool.query(
                `SELECT c.*, u.user_nickname, u.user_avatar 
                FROM goods_comment c 
                LEFT JOIN user_base u ON c.user_id = u.user_id 
                WHERE c.goods_id = ? AND c.status = 1 
                ORDER BY c.create_time ASC`,
                [goods_id]
            );

            // 整理评论树（顶级评论和回复）
            comments = rows.filter(item => item.parent_id === 0);
            const replies = rows.filter(item => item.parent_id !== 0);

            comments.forEach(comment => {
                comment.replies = replies.filter(reply => reply.parent_id === comment.comment_id);
            });
        } else {
            const [rows] = await pool.query(
                `SELECT * FROM goods_comment ORDER BY create_time ASC`,
            );
            comments = rows;
        }



        res.status(200).json({
            code: 200,
            message: '获取评论列表成功',
            data: comments
        });
    } catch (err) {
        console.error('获取评论列表失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 发布评论/回复 
 * @route POST /comment/add 
 */
async function addComment(req, res) {
    console.log('发布评论', req.body);
    const { goods_id, user_id, content, score, parent_id, comment_pics } = req.body;

    if (!goods_id || !user_id || !content) {
        return res.status(400).json({ code: 400, message: '商品ID、用户ID和内容不能为空' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO goods_comment (goods_id, user_id, content, comment_pics, score, parent_id, status, create_time) 
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
            [goods_id, user_id, content, comment_pics || null, score || 5, parent_id || 0]
        );

        res.status(201).json({
            code: 200,
            message: '发布成功',
            data: {
                comment_id: result.insertId
            }
        });
    } catch (err) {
        console.error('发布评论失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 删除评论 
 * @route POST /comment/delete 
 */
async function deleteComment(req, res) {
    const { comment_id, user_id } = req.body;

    if (!comment_id || !user_id) {
        return res.status(400).json({ code: 400, message: '评论ID和用户ID不能为空' });
    }

    try {
        // 验证是否是本人评论
        const [rows] = await pool.query(
            'SELECT user_id FROM goods_comment WHERE comment_id = ?',
            [comment_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ code: 404, message: '评论不存在' });
        }

        if (rows[0].user_id !== user_id) {
            return res.status(403).json({ code: 403, message: '无权删除他人评论' });
        }

        // 物理删除评论及其所有回复
        await pool.query('DELETE FROM goods_comment WHERE comment_id = ? OR parent_id = ?', [comment_id, comment_id]);

        res.status(200).json({
            code: 200,
            message: '评论删除成功'
        });
    } catch (err) {
        console.error('删除评论失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/**
 * 隐藏评论 
 * @route POST /admin/comment/hide 
 */
async function hideComment(req, res) {
    const { comment_id, status } = req.body; // status: 1-显示, 2-隐藏

    if (!comment_id || !status) {
        return res.status(400).json({ code: 400, message: '评论ID和状态不能为空' });
    }

    try {
        await pool.query(
            'UPDATE goods_comment SET status = ? WHERE comment_id = ?',
            [status, comment_id]
        );

        res.status(200).json({
            code: 200,
            message: status === 2 ? '评论已隐藏' : '评论已显示'
        });
    } catch (err) {
        console.error('更新评论状态失败:', err);
        res.status(500).json({ code: 500, message: 'Internal server error' });
    }
}

/** 
 * 获取推荐商品 
 * @route GET /goods/recommend 
 */
async function getRecommendGoods(req, res) {
    console.log('获取推荐商品', req.query);
    const tokenUserId = req.user?.userId ? Number(req.user.userId) : null;
    const queryUserId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;
    const userId = queryUserId ?? tokenUserId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cateId = parseInt(req.query.cate_id, 10) || 0;
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';

    if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ code: 400, message: 'user_id 必填且为数字' });
    }

    if (tokenUserId && tokenUserId !== userId) {
        return res.status(403).json({ code: 403, message: '无权限' });
    }

    const goodsSelectSql = `
    SELECT
      gi.goods_id, gi.user_id, gi.cate_id, gi.goods_name, gi.goods_desc, gi.goods_pic,
      gi.goods_new_level, gi.goods_type, gi.goods_price, gi.exchange_want,
      gi.goods_lng, gi.goods_lat, gi.goods_status, gi.browse_count, gi.goods_stock,
      gi.create_time, gi.update_time
    FROM goods_info gi
  `;

    try {
        if (keyword) {
            let prefCateIds = [];
            const [recentClickRows] = await pool.query(
                `
        SELECT cate_id, MAX(create_time) AS last_time
        FROM user_behavior
        WHERE user_id = ?
          AND action_type = 2
          AND cate_id IS NOT NULL
        GROUP BY cate_id
        ORDER BY last_time DESC
        LIMIT 3
        `,
                [userId]
            );
            prefCateIds = recentClickRows.map(r => r.cate_id);

            if (prefCateIds.length === 0) {
                const [recentAnyRows] = await pool.query(
                    `
          SELECT cate_id, MAX(create_time) AS last_time
          FROM user_behavior
          WHERE user_id = ?
            AND cate_id IS NOT NULL
          GROUP BY cate_id
          ORDER BY last_time DESC
          LIMIT 3
          `,
                    [userId]
                );
                prefCateIds = recentAnyRows.map(r => r.cate_id);
            }

            const safePrefCateIds = prefCateIds
                .map((v) => Number(v))
                .filter((v) => Number.isInteger(v));
            const orderByPref = safePrefCateIds.length
                ? `CASE gi.cate_id ${safePrefCateIds.map((id, idx) => `WHEN ${id} THEN ${safePrefCateIds.length - idx}`).join(' ')} ELSE 0 END DESC,`
                : '';

            const like = `%${keyword}%`;
            const whereCate = cateId > 0 ? ' AND gi.cate_id = ?' : '';
            const params = [userId, userId, like, like, like];
            if (cateId > 0) params.push(cateId);
            params.push(like, limit);

            const [rows] = await pool.query(
                goodsSelectSql + `
          LEFT JOIN goods_collect gc ON gc.goods_id = gi.goods_id AND gc.user_id = ?
          WHERE gi.goods_status = 1
            AND gi.user_id <> ?
            AND gc.collect_id IS NULL
            AND (
              gi.goods_name LIKE ?
              OR gi.goods_desc LIKE ?
              OR gi.exchange_want LIKE ?
            )
            ${whereCate}
          ORDER BY ${orderByPref} (gi.goods_name LIKE ?) DESC, gi.browse_count DESC, RAND()
          LIMIT ?
        `,
                params
            );

            return res.json({ code: 200, message: 'success', data: rows });
        }

        if (cateId > 0) {
            const [rows] = await pool.query(
                goodsSelectSql + `
          WHERE gi.goods_status = 1
            AND gi.user_id <> ?
            AND gi.cate_id = ?
          ORDER BY gi.browse_count DESC, RAND()
          LIMIT ?
        `,
                [userId, cateId, limit]
            );

            return res.json({ code: 200, message: 'success', data: rows });
        }

        let prefCateIds = [];
        const [recentClickRows] = await pool.query(
            `
      SELECT cate_id, MAX(create_time) AS last_time
      FROM user_behavior
      WHERE user_id = ?
        AND action_type = 2
        AND cate_id IS NOT NULL
      GROUP BY cate_id
      ORDER BY last_time DESC
      LIMIT 3
      `,
            [userId]
        );

        prefCateIds = recentClickRows.map(r => r.cate_id);

        if (prefCateIds.length === 0) {
            const [recentAnyRows] = await pool.query(
                `
        SELECT cate_id, MAX(create_time) AS last_time
        FROM user_behavior
        WHERE user_id = ?
          AND cate_id IS NOT NULL
        GROUP BY cate_id
        ORDER BY last_time DESC
        LIMIT 3
        `,
                [userId]
            );
            prefCateIds = recentAnyRows.map(r => r.cate_id);
        }

        if (prefCateIds.length === 0) {
            const [hotRows] = await pool.query(
                goodsSelectSql + `
          WHERE gi.goods_status = 1
            AND gi.user_id <> ?
          ORDER BY gi.browse_count DESC, RAND()
          LIMIT ?
        `,
                [userId, limit]
            );
            return res.json({ code: 200, message: 'success', data: hotRows });
        }

        const safePrefCateIds = prefCateIds
            .map((v) => Number(v))
            .filter((v) => Number.isInteger(v));
        const orderByPref = safePrefCateIds.length
            ? `CASE gi.cate_id ${safePrefCateIds.map((id, idx) => `WHEN ${id} THEN ${safePrefCateIds.length - idx}`).join(' ')} ELSE 0 END DESC,`
            : '';

        const [prefGoodsRows] = await pool.query(
            goodsSelectSql + `
        LEFT JOIN goods_collect gc ON gc.goods_id = gi.goods_id AND gc.user_id = ?
        WHERE gi.goods_status = 1
          AND gi.user_id <> ?
          AND gc.collect_id IS NULL
          AND gi.cate_id IN (?)
        ORDER BY ${orderByPref} gi.browse_count DESC, RAND()
        LIMIT ?
      `,
            [userId, userId, prefCateIds, limit]
        );

        const pickedIds = prefGoodsRows.map(g => g.goods_id);
        const remain = limit - prefGoodsRows.length;

        if (remain <= 0) {
            return res.json({ code: 200, message: 'success', data: prefGoodsRows });
        }

        let fillRows = [];
        if (pickedIds.length > 0) {
            const [rows] = await pool.query(
                goodsSelectSql + `
          WHERE gi.goods_status = 1
            AND gi.user_id <> ?
            AND gi.goods_id NOT IN (?)
          ORDER BY gi.browse_count DESC, RAND()
          LIMIT ?
        `,
                [userId, pickedIds, remain]
            );
            fillRows = rows;
        } else {
            const [rows] = await pool.query(
                goodsSelectSql + `
          WHERE gi.goods_status = 1
            AND gi.user_id <> ?
          ORDER BY gi.browse_count DESC, RAND()
          LIMIT ?
        `,
                [userId, remain]
            );
            fillRows = rows;
        }

        return res.json({ code: 200, message: 'success', data: [...prefGoodsRows, ...fillRows] });
    } catch (err) {
        return res.status(500).json({ code: 500, message: '内部服务器错误: ' + err.message });
    }
}

/** 
 * 报告用户行为 
 * @route POST /behavior/report 
 */
async function reportBehavior(req, res) {
    console.log('报告用户行为', req.body);
    const user_id = parseInt(req.body.user_id, 10);
    const action_type = parseInt(req.body.action_type, 10);
    const goods_id = req.body.goods_id ? parseInt(req.body.goods_id, 10) : null;
    let cate_id = req.body.cate_id ? parseInt(req.body.cate_id, 10) : null;
    const keyword = typeof req.body.keyword === 'string' ? req.body.keyword.trim() : null;

    if (!user_id || Number.isNaN(user_id)) {
        return res.status(400).json({ code: 400, message: 'user_id 必填且为数字' });
    }
    if (!action_type || Number.isNaN(action_type) || action_type < 1 || action_type > 7) {
        return res.status(400).json({ code: 400, message: 'action_type 必填且范围为 1~7' });
    }

    if (req.user?.userId && req.user.userId !== user_id) {
        return res.status(403).json({ code: 403, message: '无权限' });
    }

    try {
        if (!cate_id && goods_id) {
            const [rows] = await pool.query(
                `SELECT cate_id FROM goods_info WHERE goods_id = ? LIMIT 1`,
                [goods_id]
            );
            cate_id = rows?.[0]?.cate_id ?? null;
        }

        await pool.query(
            `
      INSERT INTO user_behavior(user_id, goods_id, cate_id, action_type, keyword)
      VALUES (?, ?, ?, ?, ?)
      `,
            [user_id, goods_id, cate_id, action_type, keyword]
        );

        return res.json({ code: 200, message: 'success' });
    } catch (err) {
        return res.status(500).json({ code: 500, message: '内部服务器错误: ' + err.message });
    }
}
