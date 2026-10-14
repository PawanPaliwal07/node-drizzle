const { sql } = require("drizzle-orm");
const { db } = require("../db");

exports.getAllLeads = async (req, res) => {
    try {
        const result = await db.execute(sql`
      SELECT 
      ROW_NUMBER() OVER (ORDER BY ContactID DESC) AS SerialNo,
      ContactID, VendorID, FullName, EmailID, PhoneNo,
      CompanyName, Message, EnquiryType, EnquiryFor,
      CountryName, PageName,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate, IsRead
      FROM mst_contact_us 
      ORDER BY ContactID DESC
    `);
        const rows = result[0];
        res.json(rows);
    } catch (err) {
        console.error("[getAllLeads]", err);
        res.status(500).json({ error: "Database error", details: err.message });
    }
};

exports.saveNewEnquiry = async (req, res) => {
    try {
        const { VendorID = null, FullName, EmailID, PhoneNo, CompanyName = null, Message, EnquiryType, EnquiryFor, CountryName = null, PageName = "/thank-you", } = req.body;
        const currentTime = new Date();
        const IsRead = 0;
        const result = await db.execute(sql` INSERT INTO mst_contact_us ( VendorID, FullName, EmailID, PhoneNo, CompanyName, Message, EnquiryType, EnquiryFor, CountryName, PageName, PostedDate, IsRead ) VALUES ( ${VendorID}, ${FullName}, ${EmailID}, ${PhoneNo}, ${CompanyName}, ${Message}, ${EnquiryType}, ${EnquiryFor}, ${CountryName}, ${PageName}, ${currentTime}, ${IsRead} ) `);
        res.json({
            success: true,
            message: "Enquiry submitted successfully!",
            contactId: result[0].insertId,
        });
    } catch (err) {
        console.error("[saveNewEnquiry]", err);
        res.status(500).json({
            success: false,
            message: "Failed to save enquiry",
        });
    }
};

exports.deleteEnquiry = async (req, res) => {
    try {
        const ContactID = req.params.ContactID;
        const result = await db.execute(sql`DELETE FROM mst_contact_us WHERE ContactID = ${ContactID}`);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Enquiry not found" });
        }
        res.json({ success: true, message: "Enquiry deleted successfully" });
    } catch (err) {
        console.error("[deleteEnquiry]", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
};