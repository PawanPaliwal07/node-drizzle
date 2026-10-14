const { mysqlTable, int, tinyint } = require("drizzle-orm/mysql-core");

const mstUserPagesPermissions = mysqlTable("mst_userpagespermissions", {
  PermissionID: int("PermissionID").autoincrement().primaryKey(),
  LoginID: int("LoginID").notNull(),
  PageID: int("PageID").notNull(),
  CanRead: tinyint("CanRead").default(0),
  CanWrite: tinyint("CanWrite").default(0),
  CanDelete: tinyint("CanDelete").default(0),
  CanAdd: tinyint("CanAdd").default(0),
});

module.exports = { mstUserPagesPermissions };