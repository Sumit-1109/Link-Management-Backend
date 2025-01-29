const Link = require("../schema/Link.schema");
const express = require("express");
const dotenv = require("dotenv");
const device = require("express-device");
const crypto = require("crypto");
const validator = require("validator");

dotenv.config();

const createShortURL = async (req, res) => {
  const { originalURL, expirationDate, remarks } = req.body;

  if (!originalURL) {
    return res.status(400).json({ message: "Destination is required !!" });
  }

  if (!validator.isURL(originalURL)) {
    return res.status(400).json({ message: "Invalid URL format" });
  }

  try {
    let shortURL;
    let isUnique = false;

    while (!isUnique) {
      shortURL = crypto.randomBytes(4).toString("hex");
      const existingLink = await Link.findOne({ shortURL });
      if (!existingLink) isUnique = true;
    }

    const newLink = new Link({
      originalURL,
      shortURL,
      expirationDate: expirationDate || null,
      remarks,
      createdBy: req.user.id,
    });

    await newLink.save();

    return res.status(201).json({
      message: "Short URL created successfully !!",
      shortURL: `${process.env.BASE_URL}/links/${shortURL}`, 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getLinks = async (req, res) => {
  try {

    const { page = 1, limit = 10, sortBy = "createdAt", order = "asc" } = req.query;
    const sortField = sortBy === 'status' ? "status" : "createdAt";
    const sortOrder = order === 'asc' ? 1 : -1;

    const totalLinks = await Link.countDocuments({
        createdBy : req.user.id
    });

    const links = await Link.find({
      createdBy: req.user.id,
    }).sort({ [sortField]: sortOrder })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    if (!links || links.length === 0) {
      return res.status(404).json({ message: "No links found. Shorten some!" });
    }

    const linkDetails = links.map((link) => ({
      id: link._id,
      createdAt: new Date(link.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      originalURL: link.originalURL,
      shortURL: `${process.env.BASE_URL}/${link.shortURL}`, 
      remarks: link.remarks,
      clicks: link.clicks.length,
      status:
        link.expirationDate && new Date() > link.expirationDate
          ? "Inactive"
          : "Active",
    }));

    return res.status(200).json({
      links: linkDetails,
      totalPages: Math.ceil(totalLinks/limit),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err,
    });
  }
};

const getLinkAnalytics = async (req, res) => {
  try {

    if(!req.user.id){
      return res.status(401).json({message: "Unauthorized"});
    }

    const { page = 1, limit = 10, sortBy = "timestamp", order = "desc" } = req.query;
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const links = await Link.find({
      createdBy: req.user.id,
    });

    if(!links.length) {
      return res.status(404).json({
        message: "No links found. Shorten some!",
      })
    }

    let analyticsData = [];

    links.forEach((link) => {
      link.clicks.forEach((click) => {
        analyticsData.push({
          timestamp: click.timestamp,
          originalURL: link.originalURL,
          shortURL: `${process.env.BASE_URL}/${link.shortURL}`, 
          ip: click.ip,
          device: click.device,
          browser: click.browser
        });
      });
    });

    analyticsData.sort((a, b) => sortOrder * (new Date(b.timestamp) - new Date(a.timestamp)));

    const startIndex = (page - 1) * limit;
    const paginatedData = analyticsData.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      analytics: paginatedData,
      totalEntries: analyticsData.length,
      totalPages: Math.ceil(analyticsData.length/limit)
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};


const updateLink = async (req, res) => {
  const { id } = req.params;
  const { expirationDate, remarks } = req.body;

  try {
    const link = await Link.findById(id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    link.expirationDate = expirationDate;
    link.remarks = remarks;

    await link.save();

    return res.status(200).json({ message: "Link updated successfully", link });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDashboardLinkDetails = async (req, res) => {

    const userId = req.user.id;

    if(!userId) {
        return res.status(400).json({
            message: "User Id not found !!"
        });
    };


  try {

    const links = await Link.find({
      createdBy: req.user.id,
    });

    if (!links || links.length === 0) {
      return res.status(404).json({
        message: "No links found, create some !!",
      });
    }

    let totalClicks = 0;
    let dateAnalytics = {};
    let deviceAnalytics = {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
    };

    links.forEach((link) => {
      totalClicks += link.clicks.length;

      link.clicks.forEach((click) => {
        const date = click.timestamp.toISOString().split("T")[0];
        dateAnalytics[date] = (dateAnalytics[date] || 0) + 1;

        const deviceType = click.device;
        deviceAnalytics[deviceType] = (deviceAnalytics[deviceType] || 0) + 1;
      });
    });

    return res.status(200).json({
      totalClicks,
      dateAnalytics,
      deviceAnalytics,
      message: "Successfull",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Something is wrong in this universe !!",
    });
  }
};

const getLinkDetails = async (req, res) => {

  const {id} = req.params;

  try{
    const linkDetails = await Link.findById(id);

    if (!linkDetails) {
      return res.status(404).json({ message: "Link not found" });
    }

    return res.status(200).json({
      linkDetails : linkDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message : "Something is wrong with the universe !!"
    })
  }

}

const deleteLink = async (req, res) => {
  const { id } = req.params;

  if(!id) {
    return res.status(400).json({message: "Link id is required" });
  }

  try {
    const link = await Link.findByIdAndDelete(id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    return res.status(200).json({ message: "Link deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

module.exports = {
  createShortURL,
  getLinks,
  getLinkAnalytics,
  updateLink,
  deleteLink,
  getDashboardLinkDetails,
  getLinkDetails
};
