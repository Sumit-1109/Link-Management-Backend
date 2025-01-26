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
      shortURL: `${req.protocol}://${req.get("host")}/${shortURL}`,
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

    const {sortBy, order} = req.query;
    const sortField = sortBy === 'status' ? "status" : "createdAt";
    const sortOrder = order === 'asc' ? 1 : -1;

    const links = await Link.find({
      createdBy: req.user.id,
    });

    if (!links || links.length === 0) {
      return res.status(404).json({ message: "No links found. Shorten some!" });
    }

    const linkDetails = links.map((link) => ({
      createdAt: link.createdAt.toISOString().split("T")[0],
      originalURL: link.originalURL,
      shortURL: `${req.protocol}://${req.get("host")}/${link.shortURL}`,
      remarks: link.remarks,
      clicks: link.clicks.length,
      status:
        link.expirationDate && new Date() > link.expirationDate
          ? "Inactive"
          : "Active",
    }));

    const sortedLinks = linkDetails.sort((a,b) => {
        if (sortField === "status") {
            return sortOrder * a.status.localeCompare(b.status);
        }

        return sortOrder * a.status.localeCompare(b.status);
    });

    return res.status(200).json({
      links: sortedLinks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err,
    });
  }
};

const redirectToOriginal = async (req, res) => {
  try {
    const { shortURL } = req.params;

    const link = await Link.findOne({ shortURL });

    if (link.expirationDate && new Date() > link.expirationDate) {
      return res.status(410).json({ message: "This link is no more :(" });
    }

    if (!link) {
      return res.status(404).json({ message: "This link is no more :(" });
    }

    const clickData = {
      ip: req.ip,
      timestamp: new Date(),
      device: req.device.type,
    };

    const updatedLink = await Link.findOneAndUpdate(
      { shortURL },
      {
        $inc: { totalClicks: 1 },
        $push: { clicks: clickData },
      },
      {
        new: true,
      }
    );

    if (!updatedLink) {
      return res.status(500).json({ message: "Failed to update" });
    }

    res.redirect(link.originalURL);
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err,
    });
  }
};

const getLinkAnalytics = async (req, res) => {
  try {
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const links = await Link.find({
      createdBy: req.user._id,
    }).sort({
      "clicks.timestamp": sortOrder,
    });

    let analyticsData = [];

    links.forEach((link) => {
      link.clicks.forEach((click) => {
        analyticsData.push({
          timestamp: click.timestamp,
          originalURL: link.originalURL,
          shortURL: link.shortURL,
          ip: click.ip,
          device: click.device,
        });
      });
    });

    res.status(200).json({
      analytics: analyticsData,
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const updateLink = async (req, res) => {
  const { shortURL } = req.params;
  const { originalURL, expirationDate, remarks } = req.body;

  try {
    const link = await Link.findOne({ shortURL });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    link.originalURL = originalURL || link.originalURL;
    link.expirationDate = expirationDate || link.expirationDate;
    link.remarks = remarks || link.remarks;

    await link.save();

    return res.status(200).json({ message: "Link updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDashboardLinkDetails = async (req, res) => {
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
      mobile: 0,
      desktop: 0,
      tablet: 0,
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

const deleteLink = async (req, res) => {
  const { shortURL } = req.params;

  try {
    const link = await Link.findOneAndDelete({ shortURL });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    return res.status(200).json({ message: "Link deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createShortURL,
  getLinks,
  getLinkAnalytics,
  redirectToOriginal,
  updateLink,
  deleteLink,
  getDashboardLinkDetails,
};
