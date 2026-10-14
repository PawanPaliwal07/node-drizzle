const path = require("path");
const fs = require("fs");
const { sql } = require("drizzle-orm");
const { db } = require("../db");

const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, "../uploads/OnlineImages/PageImages", imagePath,);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Error deleting old image:", err);
    }
  });
};

exports.getAllStatics = async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT ROW_NUMBER() OVER (ORDER BY StaticID DESC) AS SerialNo,
      StaticID, StaticName, StaticNameURL, ActiveStatus,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
      FROM mst_staticdata
      ORDER BY StaticID DESC
    `);
    const rows = result[0];
    res.json(rows);
  } catch (err) {
    console.error("[getAllStatics]", err);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getStaticById = async (req, res) => {
  const StaticID = req.query.StaticID;
  if (!StaticID) {
    return res.status(400).json({ success: false, message: "Missing Static ID" });
  }
  try {
    const result = await db.execute(sql`  SELECT * FROM mst_staticdata WHERE StaticID = ${StaticID} LIMIT 1 `);
    const rows = result[0];
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Static not found" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[getStaticById]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.saveOrUpdateStatic = async (req, res) => {
  const {
    StaticID,
    StaticName,
    StaticNameURL,
    SmallDescription,
    Description,
    ProductListingHeading,
    ProductListingDescription,
    ActiveStatus,
    StaticAddress,
    StaticAddress2,
    StaticPhoneNumber,
    StaticPhoneNumber2,
    StaticMobileNumber,
    StaticMobileNumber2,
    StaticEmail,
    StaticTwitterLink,
    StaticFacebookLink,
    StaticInstagramLink,
    StaticLinkedInLink,
    StaticYouTubeLink,
    StaticWhatsAppLink,
    StaticPinterestLink,
    BannerBtnText,
    BannerBtnUrl,
    Section1Heading,
    Section1Description,
    Section1BtnText,
    Section1BtnUrl,
    Section2Heading,
    Section2SubHeading,
    Section2Description,
    Section2BtnText,
    Section2BtnUrl,
    Section4Heading,
    Section4Description,
    Section4BtnText,
    Section4BtnUrl,
    ThirdPartyLink,
    ThirdPartyActiveStatus,
    FooterHeading,
    FooterTagline,
    MetaTitle,
    MetaKeywords,
    MetaDescriptions,
    MetaSchema,
    UpdatedBy,
  } = req.body;

  const parseMediaValue = (fieldName, oldData) => {
    const altFieldName = fieldName === "bannerVideoImage" ? "bannerVideoImage1" : fieldName === "bannerVideoImage1" ? "bannerVideoImage" : null;
    if (req.files?.[fieldName]?.[0]?.filename) {
      return req.files[fieldName][0].filename;
    }
    if (altFieldName && req.files?.[altFieldName]?.[0]?.filename) {
      return req.files[altFieldName][0].filename;
    }
    if (req.body[fieldName] !== undefined) {
      const val = req.body[fieldName];
      if (val === "" || val === "null" || val === null) return null;
      return val;
    }
    if (altFieldName && req.body[altFieldName] !== undefined) {
      const val = req.body[altFieldName];
      if (val === "" || val === "null" || val === null) return null;
      return val;
    }
    if (oldData) {
      if (oldData[fieldName] !== undefined && oldData[fieldName] !== null)
        return oldData[fieldName];
      if (altFieldName && oldData[altFieldName] !== undefined && oldData[altFieldName] !== null) return oldData[altFieldName];
    }
    return null;
  };
  const currentTime = new Date();
  try {
    const dupResult = await db.execute(sql`SELECT StaticID FROM mst_staticdata WHERE (StaticName = ${StaticName} OR StaticNameURL = ${StaticNameURL}) ${StaticID ? sql`AND StaticID != ${StaticID}` : sql``} `);
    const dupRows = dupResult[0];
    if (dupRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Static with the same name or URL already exists",
      });
    }
    if (StaticID) {
      const fetchResult = await db.execute(sql`
        SELECT StaticImage, StaticBannerVideo, BannerBigVideo, Section1File, ThirdPartyImage, bannerVideoImage, bannerVideoImage2, bannerVideoImage3, bannerVideoImage4, bannerVideoImage5
        FROM mst_staticdata WHERE StaticID = ${StaticID}
      `);
      const fetchRows = fetchResult[0];
      if (fetchRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Invalid StaticID: no record found for ID " + StaticID,
        });
      }
      const oldData = fetchRows[0];
      const StaticImage = parseMediaValue("StaticImage", oldData);
      const StaticBannerVideo = parseMediaValue("StaticBannerVideo", oldData);
      const BannerBigVideo = parseMediaValue("BannerBigVideo", oldData);
      const Section1File = parseMediaValue("Section1File", oldData);
      const ThirdPartyImage = parseMediaValue("ThirdPartyImage", oldData);
      const bannerVideoImage = parseMediaValue("bannerVideoImage", oldData);
      const bannerVideoImage2 = parseMediaValue("bannerVideoImage2", oldData);
      const bannerVideoImage3 = parseMediaValue("bannerVideoImage3", oldData);
      const bannerVideoImage4 = parseMediaValue("bannerVideoImage4", oldData);
      const bannerVideoImage5 = parseMediaValue("bannerVideoImage5", oldData);

      if (oldData.StaticImage && oldData.StaticImage !== StaticImage)
        deleteOldImage(oldData.StaticImage);
      if (oldData.StaticBannerVideo && oldData.StaticBannerVideo !== StaticBannerVideo)
        deleteOldImage(oldData.StaticBannerVideo);
      if (oldData.BannerBigVideo && oldData.BannerBigVideo !== BannerBigVideo)
        deleteOldImage(oldData.BannerBigVideo);
      if (oldData.Section1File && oldData.Section1File !== Section1File)
        deleteOldImage(oldData.Section1File);
      if (oldData.ThirdPartyImage && oldData.ThirdPartyImage !== ThirdPartyImage)
        deleteOldImage(oldData.ThirdPartyImage);
      if (oldData.bannerVideoImage && oldData.bannerVideoImage !== bannerVideoImage)
        deleteOldImage(oldData.bannerVideoImage);
      if (oldData.bannerVideoImage2 && oldData.bannerVideoImage2 !== bannerVideoImage2)
        deleteOldImage(oldData.bannerVideoImage2);
      if (oldData.bannerVideoImage3 && oldData.bannerVideoImage3 !== bannerVideoImage3)
        deleteOldImage(oldData.bannerVideoImage3);
      if (oldData.bannerVideoImage4 && oldData.bannerVideoImage4 !== bannerVideoImage4)
        deleteOldImage(oldData.bannerVideoImage4);
      if (oldData.bannerVideoImage5 && oldData.bannerVideoImage5 !== bannerVideoImage5)
        deleteOldImage(oldData.bannerVideoImage5);

      await db.execute(sql`
        UPDATE mst_staticdata SET
          StaticName = ${StaticName}, StaticNameURL = ${StaticNameURL},
          StaticImage = ${StaticImage}, StaticBannerVideo = ${StaticBannerVideo}, BannerBigVideo = ${BannerBigVideo}, Section1File = ${Section1File}, ThirdPartyImage = ${ThirdPartyImage},
          bannerVideoImage = ${bannerVideoImage}, bannerVideoImage2 = ${bannerVideoImage2}, bannerVideoImage3 = ${bannerVideoImage3}, bannerVideoImage4 = ${bannerVideoImage4}, bannerVideoImage5 = ${bannerVideoImage5},
          SmallDescription = ${SmallDescription}, Description = ${Description},
          ProductListingHeading = ${ProductListingHeading}, ProductListingDescription = ${ProductListingDescription},
          ActiveStatus = ${ActiveStatus},
          StaticAddress = ${StaticAddress}, StaticAddress2 = ${StaticAddress2},
          StaticPhoneNumber = ${StaticPhoneNumber}, StaticPhoneNumber2 = ${StaticPhoneNumber2},
          StaticMobileNumber = ${StaticMobileNumber}, StaticMobileNumber2 = ${StaticMobileNumber2}, StaticEmail = ${StaticEmail},
          StaticTwitterLink = ${StaticTwitterLink}, StaticFacebookLink = ${StaticFacebookLink}, StaticInstagramLink = ${StaticInstagramLink},
          StaticLinkedInLink = ${StaticLinkedInLink}, StaticYouTubeLink = ${StaticYouTubeLink}, StaticWhatsAppLink = ${StaticWhatsAppLink}, StaticPinterestLink = ${StaticPinterestLink},
          BannerBtnText = ${BannerBtnText}, BannerBtnUrl = ${BannerBtnUrl},
          Section1Heading = ${Section1Heading}, Section1Description = ${Section1Description}, Section1BtnText = ${Section1BtnText}, Section1BtnUrl = ${Section1BtnUrl},
          Section2Heading = ${Section2Heading}, Section2SubHeading = ${Section2SubHeading}, Section2Description = ${Section2Description}, Section2BtnText = ${Section2BtnText}, Section2BtnUrl = ${Section2BtnUrl},
          Section4Heading = ${Section4Heading}, Section4Description = ${Section4Description}, Section4BtnText = ${Section4BtnText}, Section4BtnUrl = ${Section4BtnUrl},
          ThirdPartyLink = ${ThirdPartyLink}, ThirdPartyActiveStatus = ${ThirdPartyActiveStatus},
          FooterHeading = ${FooterHeading}, FooterTagline = ${FooterTagline},
          MetaTitle = ${MetaTitle}, MetaKeywords = ${MetaKeywords}, MetaDescriptions = ${MetaDescriptions}, MetaSchema = ${MetaSchema},
          UpdatedBy = ${UpdatedBy}, UpdatedOn = ${currentTime}
        WHERE StaticID = ${StaticID}
      `);
      return res.json({ success: true, message: "Static updated successfully" });
    } else {
      const StaticImage = parseMediaValue("StaticImage", null);
      const StaticBannerVideo = parseMediaValue("StaticBannerVideo", null);
      const BannerBigVideo = parseMediaValue("BannerBigVideo", null);
      const Section1File = parseMediaValue("Section1File", null);
      const ThirdPartyImage = parseMediaValue("ThirdPartyImage", null);
      const bannerVideoImage = parseMediaValue("bannerVideoImage", null);
      const bannerVideoImage2 = parseMediaValue("bannerVideoImage2", null);
      const bannerVideoImage3 = parseMediaValue("bannerVideoImage3", null);
      const bannerVideoImage4 = parseMediaValue("bannerVideoImage4", null);
      const bannerVideoImage5 = parseMediaValue("bannerVideoImage5", null);
      await db.execute(sql`
        INSERT INTO mst_staticdata (
          StaticName, StaticNameURL, StaticImage, StaticBannerVideo, BannerBigVideo,
          bannerVideoImage, bannerVideoImage2, bannerVideoImage3, bannerVideoImage4, bannerVideoImage5,
          SmallDescription, Description,
          ProductListingHeading, ProductListingDescription,
          ActiveStatus,
          StaticAddress, StaticAddress2,
          StaticPhoneNumber, StaticPhoneNumber2,
          StaticMobileNumber, StaticMobileNumber2, StaticEmail,
          StaticTwitterLink, StaticFacebookLink, StaticInstagramLink,
          StaticLinkedInLink, StaticYouTubeLink, StaticWhatsAppLink, StaticPinterestLink,
          BannerBtnText, BannerBtnUrl,
          Section1Heading, Section1Description, Section1BtnText, Section1BtnUrl, Section1File,
          Section2Heading, Section2SubHeading, Section2Description, Section2BtnText, Section2BtnUrl,
          Section4Heading, Section4Description, Section4BtnText, Section4BtnUrl,
          ThirdPartyImage, ThirdPartyLink, ThirdPartyActiveStatus,
          FooterHeading, FooterTagline,
          MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema,
          PostedDate, UpdatedBy, UpdatedOn
        )
        VALUES (
          ${StaticName}, ${StaticNameURL}, ${StaticImage}, ${StaticBannerVideo}, ${BannerBigVideo},
          ${bannerVideoImage}, ${bannerVideoImage2}, ${bannerVideoImage3}, ${bannerVideoImage4}, ${bannerVideoImage5},
          ${SmallDescription}, ${Description},
          ${ProductListingHeading}, ${ProductListingDescription},
          ${ActiveStatus},
          ${StaticAddress}, ${StaticAddress2},
          ${StaticPhoneNumber}, ${StaticPhoneNumber2},
          ${StaticMobileNumber}, ${StaticMobileNumber2}, ${StaticEmail},
          ${StaticTwitterLink}, ${StaticFacebookLink}, ${StaticInstagramLink},
          ${StaticLinkedInLink}, ${StaticYouTubeLink}, ${StaticWhatsAppLink}, ${StaticPinterestLink},
          ${BannerBtnText}, ${BannerBtnUrl},
          ${Section1Heading}, ${Section1Description}, ${Section1BtnText}, ${Section1BtnUrl}, ${Section1File},
          ${Section2Heading}, ${Section2SubHeading}, ${Section2Description}, ${Section2BtnText}, ${Section2BtnUrl},
          ${Section4Heading}, ${Section4Description}, ${Section4BtnText}, ${Section4BtnUrl},
          ${ThirdPartyImage}, ${ThirdPartyLink}, ${ThirdPartyActiveStatus},
          ${FooterHeading}, ${FooterTagline},
          ${MetaTitle}, ${MetaKeywords}, ${MetaDescriptions}, ${MetaSchema},
          ${currentTime}, ${UpdatedBy}, ${currentTime}
        )
      `);
      return res.json({ success: true, message: "Static created successfully" });
    }
  } catch (err) {
    console.error("[saveOrUpdateStatic]", err);
    return res.status(500).json({
      success: false,
      message: err.sqlMessage || err.message || "Database error",
    });
  }
};

exports.deleteStatic = async (req, res) => {
  const StaticID = req.params.StaticID;
  try {
    const fetchResult = await db.execute(sql`
      SELECT StaticImage, StaticBannerVideo, BannerBigVideo, ThirdPartyImage
      FROM mst_staticdata WHERE StaticID = ${StaticID} LIMIT 1
    `);
    const rows = fetchResult[0];
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Static not found" });
    }
    const oldData = rows[0];
    await db.execute(sql`DELETE FROM mst_staticdata WHERE StaticID = ${StaticID}`);
    deleteOldImage(oldData.StaticImage);
    deleteOldImage(oldData.StaticBannerVideo);
    deleteOldImage(oldData.BannerBigVideo);
    deleteOldImage(oldData.ThirdPartyImage);
    res.json({ success: true, message: "Static deleted successfully" });
  } catch (err) {
    console.error("[deleteStatic]", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

exports.getMataDataById = async (req, res) => {
  const StaticID = req.params.ID;
  if (!StaticID) {
    return res.status(400).json({ success: false, message: "Missing Static ID" });
  }
  try {
    const staticResult = await db.execute(sql` SELECT * FROM mst_staticdata WHERE StaticID = ${StaticID} LIMIT 1`);
    const staticRows = staticResult[0];
    if (staticRows.length === 0) {
      return res.status(404).json({ success: false, message: "Static not found" });
    }
    const countryResult = await db.execute(sql`
      SELECT * FROM mst_staticcountries
      WHERE StaticID = ${StaticID} AND ActiveStatus = 1
      ORDER BY DisplayOrder
    `);
    const countryRows = countryResult[0];
    return res.json({
      success: true,
      data: { ...staticRows[0], Countries: countryRows || [] },
    });
  } catch (err) {
    console.error("[getMataDataById]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMataDataByUrl = async (req, res) => {
  const url = req.params.url;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing URL parameter" });
  }
  const metaQueries = [
    (u) => sql`SELECT StaticID, MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema, 'static' AS type FROM mst_staticdata WHERE StaticNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT ProductId AS StaticID, MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema, 'product' AS type FROM mst_products WHERE ProductNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT CompanyID AS StaticID, MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema, 'company' AS type FROM mst_companydata WHERE CompanyNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT CategoryID AS StaticID, MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema, 'facility' AS type FROM mst_facilitycategory WHERE CategoryNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT ClientTypeID AS StaticID, MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema, 'clienttype' AS type FROM mst_clienttype WHERE TypeNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT TrunkeyProjectID AS StaticID, MetaTitle, MetaDescription AS MetaDescriptions, MetaKeyWords AS MetaKeywords, MetaSchema, 'turnkeyproject' AS type FROM mst_turnkeyprojectdata WHERE TrunkeyProjectNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
  ];
  try {
    for (const buildQuery of metaQueries) {
      const result = await db.execute(buildQuery(url));
      const rows = result[0];
      if (rows?.[0]) return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, message: "Meta data not found" });
  } catch (err) {
    console.error("[getMataDataByUrl]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTurnkeyProjectMetaByUrl = async (req, res) => {
  const url = req.params.url;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing URL parameter" });
  }
  const metaQueries = [
    (u) => sql`SELECT TrunkeyProjectID AS StaticID, MetaTitle, MetaDescription AS MetaDescriptions, MetaKeyWords AS MetaKeywords, MetaSchema, 'turnkeyproject' AS type FROM mst_turnkeyprojectdata WHERE TrunkeyProjectNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
    (u) => sql`SELECT ClientTypeID AS StaticID, MetaTitle, MetaDescriptions, MetaKeyWords AS MetaKeywords, MetaSchema, 'clienttype' AS type FROM mst_clienttype WHERE TypeNameURL = ${u} AND ActiveStatus = 1 LIMIT 1`,
  ];
  try {
    for (const buildQuery of metaQueries) {
      const result = await db.execute(buildQuery(url));
      const rows = result[0];
      if (rows?.[0]) return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, message: "Meta data not found" });
  } catch (err) {
    console.error("[getTurnkeyProjectMetaByUrl]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};