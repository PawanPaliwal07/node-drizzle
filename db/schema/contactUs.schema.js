const { mysqlTable, int, varchar, text, tinyint, datetime } = require("drizzle-orm/mysql-core");

const mstContactUs = mysqlTable("mst_contact_us", {
  ContactID: int("ContactID").autoincrement().primaryKey(),
  VendorID: int("VendorID"),
  FullName: varchar("FullName", { length: 255 }).notNull(),
  EmailID: varchar("EmailID", { length: 255 }),
  PhoneNo: varchar("PhoneNo", { length: 50 }),
  CompanyName: varchar("CompanyName", { length: 255 }),
  Message: text("Message"),
  EnquiryType: varchar("EnquiryType", { length: 100 }),
  EnquiryFor: varchar("EnquiryFor", { length: 100 }),
  CountryName: varchar("CountryName", { length: 255 }),
  PageName: varchar("PageName", { length: 255 }).default("/thank-you"),
  PostedDate: datetime("PostedDate"),
  IsRead: tinyint("IsRead").default(0),
});

module.exports = { mstContactUs };
