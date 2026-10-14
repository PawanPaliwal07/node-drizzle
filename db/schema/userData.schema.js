const { mysqlTable, int, varchar, tinyint, datetime } = require("drizzle-orm/mysql-core");

const mstUserData = mysqlTable("mst_userdata", {
  loginID: int("loginID").autoincrement().primaryKey(),
  FullName: varchar("FullName", { length: 255 }),
  EmailID: varchar("EmailID", { length: 255 }),
  PhoneNumber: varchar("PhoneNumber", { length: 50 }),
  Role: varchar("Role", { length: 100 }),
  UserName: varchar("UserName", { length: 100 }),
  Passwords: varchar("Passwords", { length: 255 }),
  ActiveStatus: tinyint("ActiveStatus").default(1),
  ProfileImage: varchar("ProfileImage", { length: 255 }),
  RegisterDate: datetime("RegisterDate"),
  LastLoginDate: datetime("LastLoginDate"),
  UpdatedBy: varchar("UpdatedBy", { length: 100 }),
  UpdatedOn: datetime("UpdatedOn"),
});

module.exports = { mstUserData };
