const jwt = require('jsonwebtoken');
// const AdminStaticData = require("../components/backendcomponents/AdminStaticData.json");
const { sql } = require("drizzle-orm");
const { db } = require('../db');

exports.login = async (req, res) => {
    try {
        const { UserName, Passwords } = req.body;
        const userResult = await db.execute(sql` SELECT * FROM mst_userdata WHERE ActiveStatus = 1 AND UserName = ${UserName} AND Passwords = ${Passwords}`);
        const userRows = userResult[0];
        if (userRows.length === 0) {
            return res.json({ success: false, message: "Invalid username or password" });
        }
        const user = userRows[0];
        const loginID = user.loginID;
        const permResult = await db.execute(sql` SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd FROM mst_userpagespermissions WHERE LoginID = ${loginID}`);
        const permissions = permResult[0];
        const token = jwt.sign(
            {
                loginID: user.loginID,
                UserName: user.UserName,
                FullName: user.FullName,
                Role: user.Role,
                ProfileImage: user.ProfileImage
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: 'lax'
        });
        return res.json({
            success: true,
            message: "Login successful",
            user,
            permissions,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
};

exports.saveOrUpdateUser = async (req, res) => {
    try {
        const body = req.body || {};
        const { LoginID, FullName, EmailID, PhoneNumber, UserName, Role, Passwords, ActiveStatus, UpdatedBy, permissions = "{}" } = body;
        const numericLoginID = LoginID ? Number(LoginID) : null;
        let ProfileImage = null;
        if (req.files && req.files.ProfileImage && req.files.ProfileImage[0]) {
            ProfileImage = req.files.ProfileImage[0].filename;
        }
        const currentTime = new Date();
        const emailResult = await db.execute(sql` SELECT LoginID FROM mst_userdata WHERE EmailID = ${EmailID} ${numericLoginID ? sql`AND LoginID <> ${numericLoginID}` : sql``} `);
        const emailRows = emailResult[0];
        if (emailRows.length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists. Please use a different email." });
        }
        const phoneResult = await db.execute(sql` SELECT LoginID FROM mst_userdata WHERE PhoneNumber = ${PhoneNumber} ${numericLoginID ? sql`AND LoginID <> ${numericLoginID}` : sql``} `);
        const phoneRows = phoneResult[0];
        if (phoneRows.length > 0) {
            return res.status(400).json({ success: false, message: "Phone number already exists. Please use a different one." });
        }
        let targetLoginID;
        if (numericLoginID) {
            try {
                if (Passwords && Passwords.trim() !== "") {
                    await db.execute(sql` UPDATE mst_userdata SET FullName=${FullName}, EmailID=${EmailID}, PhoneNumber=${PhoneNumber}, Role=${Role}, UserName=${UserName}, Passwords=${Passwords}, ActiveStatus=${ActiveStatus}, UpdatedBy=${UpdatedBy}, UpdatedOn=${currentTime} ${ProfileImage ? sql`, ProfileImage=${ProfileImage}` : sql``} WHERE LoginID=${numericLoginID}`);
                } else {
                    await db.execute(sql` UPDATE mst_userdata SET FullName=${FullName}, EmailID=${EmailID}, PhoneNumber=${PhoneNumber}, Role=${Role}, UserName=${UserName}, ActiveStatus=${ActiveStatus}, UpdatedBy=${UpdatedBy}, UpdatedOn=${currentTime} ${ProfileImage ? sql`, ProfileImage=${ProfileImage}` : sql``} WHERE LoginID=${numericLoginID}`);
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: "User update failed", error: err.message });
            }
            targetLoginID = numericLoginID;
        } else {
            let insertResult;
            try {
                insertResult = await db.execute(sql` INSERT INTO mst_userdata (FullName, EmailID, PhoneNumber, Role, UserName, Passwords, ActiveStatus, ProfileImage, RegisterDate, LastLoginDate, UpdatedBy, UpdatedOn) VALUES (${FullName}, ${EmailID}, ${PhoneNumber}, ${Role}, ${UserName}, ${Passwords}, ${ActiveStatus}, ${ProfileImage}, ${currentTime}, ${null}, ${UpdatedBy}, ${currentTime}) `);
            } catch (err) {
                return res.status(500).json({ success: false, message: "User insert failed", error: err.message });
            }
            targetLoginID = insertResult[0].insertId;
        }
        const insertValues = Object.entries(JSON.parse(permissions)).map(
            ([pageId, p]) => [
                targetLoginID,
                Number(pageId),
                p.CanRead ?? 0,
                p.CanWrite ?? 0,
                p.CanDelete ?? 0,
                p.CanAdd ?? 0,
            ]
        );
        if (insertValues.length === 0) {
            return res.json({ success: true, message: "User saved successfully (no permissions applied)" });
        }
        try {
            await db.execute(sql`DELETE FROM mst_userpagespermissions WHERE LoginID=${targetLoginID}`);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Failed to reset old permissions", error: err.message });
        }
        try {
            const valueRows = insertValues.map(
                (row) => sql`(${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]})`
            );
            const joined = sql.join(valueRows, sql`, `);
            await db.execute(sql` INSERT INTO mst_userpagespermissions (LoginID, PageID, CanRead, CanWrite, CanDelete, CanAdd) VALUES ${joined} `);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Failed to insert permissions", error: err.message });
        }
        return res.json({ success: true, message: "User & permissions saved successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database error while checking email/phone", error: err.message });
    }
};

function getAllPermissions(items, permissions = []) {
    items.forEach((item) => {
        if (item.Show === "1" && item.PageID) {
            permissions.push({
                PageID: item.PageID,
                CanRead: 1,
                CanWrite: 1,
                CanDelete: 1,
                CanAdd: 1,
            });
        }
        if (item.MoreItem && item.MoreItem.length) {
            getAllPermissions(item.MoreItem, permissions);
        }
    });
    return permissions;
}

exports.checkLogin = async (req, res) => {
    if (!req.user) {
        return res.json({ loggedIn: false });
    }
    const user = req.user;
    const loginID = user.loginID;
    if (loginID === 1) {
        // const permissions = getAllPermissions(AdminStaticData.Menu.items);
        return res.json({ loggedIn: true, user, permissions });
    }
    try {
        const result = await db.execute(sql` SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd FROM mst_userpagespermissions WHERE LoginID = ${loginID} `);
        const permissions = result[0];
        return res.json({ loggedIn: true, user: req.user, permissions });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch permissions", error: err.message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully' });
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.execute(sql`
        SELECT ROW_NUMBER() OVER (ORDER BY loginID DESC) AS SerialNo, loginID, FullName, EmailID, PhoneNumber, Role, ProfileImage, UserName, Passwords, ActiveStatus FROM mst_userdata WHERE loginID <> 1 ORDER BY loginID DESC `);
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
};

exports.updateUserActiveStatus = async (req, res) => {
    try {
        const { loginID, ActiveStatus } = req.body;
        if (!loginID || ActiveStatus === undefined) {
            return res.status(400).json({ success: false, message: "Missing loginID or ActiveStatus" });
        }
        const result = await db.execute(sql` UPDATE mst_userdata SET ActiveStatus = ${ActiveStatus} WHERE loginID = ${loginID} `);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User status updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Database error", error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const loginID = req.query.loginID;
        if (!loginID) {
            return res.status(400).json({ success: false, message: "Missing loginID" });
        }
        const userResult = await db.execute(sql` SELECT loginID, FullName, Role, ProfileImage, EmailID, Passwords, PhoneNumber, UserName, ActiveStatus FROM mst_userdata WHERE loginID = ${loginID} LIMIT 1 `);
        const userRows = userResult[0];
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const user = userRows[0];
        const permResult = await db.execute(sql` SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd FROM mst_userpagespermissions WHERE loginID = ${loginID} `);
        const permRows = permResult[0];
        const permissions = {};
        permRows.forEach((row) => {
            permissions[row.PageID] = {
                CanRead: row.CanRead,
                CanWrite: row.CanWrite,
                CanDelete: row.CanDelete,
                CanAdd: row.CanAdd,
            };
        });
        return res.json({
            success: true,
            data: {
                ...user,
                Permissions: JSON.stringify(permissions),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const loginID = req.body.loginID;
        const oldPassword = req.body.oldPassword || req.body.OldPassword;
        const newPassword = req.body.newPassword || req.body.NewPassword;
        const UpdatedBy = req.body.UpdatedBy || "System";
        if (!loginID || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "LoginID, old password and new password are required",
            });
        }
        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password",
            });
        }
        const result = await db.execute(sql`SELECT Passwords FROM mst_userdata WHERE loginID = ${loginID}`);
        const rows = result[0];
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const user = rows[0];
        if (user.Passwords !== oldPassword) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }
        const updateResult = await db.execute(sql` UPDATE mst_userdata SET Passwords = ${newPassword}, UpdatedBy = ${UpdatedBy}, UpdatedOn = NOW() WHERE loginID = ${loginID} `);
        if (updateResult[0].affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Failed to update password. User may not exist.",
            });
        }
        return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};