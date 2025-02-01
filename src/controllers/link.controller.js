const Link = require("../schema/Link.schema");
const express = require("express");
const dotenv = require("dotenv");
const device = require("express-device");
const crypto = require("crypto");
const validator = require("validator");
const BASE_URL= 'https://link-management-backend.onrender.com';

dotenv.config();

const createShortURL = async (req, res) => {
  const { originalURL, expirationDate, remarks, isExpiration } = req.body;

  console.log(`Expiration Date: ${!expirationDate} && ${isExpiration}`);

  if (!originalURL) {
    return res.status(400).json({ field: 'originalURL' , message: "Where to ?" });
  }

  if (!validator.isURL(originalURL)) {
    return res.status(400).json({field: 'originalURL', message: "Link Looks Odd" });
  }

  if(!remarks) {
    return res.status(400).json({
      field: 'remarks',
      message: "Please add a remark",
    })
  }

  if (isExpiration) {
    if (!expirationDate) {
      return res.status(400).json({
        field: 'expirationDate',
        message: "No expiration date provided !!",
      });
    }
    if (new Date(expirationDate) <= new Date()) {
      return res.status(400).json({
        field: 'expirationDate',
        message: "Future Time Please"
      });
    }
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
      message: "Shortened & Snappy",
      shortURL: `${BASE_URL}/${shortURL}`, 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server took a nap",
    });
  }
};

const getLinks = async (req, res) => {
  try {   

    const { q = "" ,page = 1, limit = 10, sortBy = "createdAt", order = "asc" } = req.query;
    const sortField = sortBy === 'status' ? "status" : "createdAt";
    const sortOrder = order === 'asc' ? 1 : -1;

    await Link.updateMany(
      { 
        expirationDate: { 
          $exists: true, 
          $lt: new Date() 
        }, 
        status: "active" },
      { 
        $set: { 
          status: "inactive" 
        } 
      }
    ); 

    const query = q
      ? {
          $or: [
            { originalURL: { $regex: q, $options: "i" } }, 
            { remarks: { $regex: q, $options: "i" } }
          ],
          createdBy: req.user.id,
        }
      : { createdBy: req.user.id };

    const totalLinks = await Link.countDocuments(query);

    const links = await Link.find(query).
    sort({
      [sortField] : sortOrder
    }).skip((page - 1) * limit).limit(parseInt(limit) || 10);

    if(q && links.length === 0){
      return res.status(404).json({ message: "Nothing of that sort" });
    }

    if (!q && (!links || links.length === 0)) {
      return res.status(404).json({ message: "Oops!! Nothing to see" });
    }

    const linkDetails = links.map((link) => {
      const isExpired = link.expirationDate && new Date() > new Date(link.expirationDate);
      return {
        id: link._id,
        createdAt: new Date(link.createdAt).toLocaleString('en-IN', {
          timeZone: "Asia/Kolkata",
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        originalURL: link.originalURL,
        shortURL: `${BASE_URL}/${link.shortURL}`,
        remarks: link.remarks,
        clicks: link.clicks.length,
        status: isExpired ? "Inactive" : "Active",
        statusSortOrder: isExpired ? 1 : 0,
      };
    });

    if (sortBy === "status") {
      linkDetails.sort((a, b) => sortOrder * (a.statusSortOrder - b.statusSortOrder));
    }

    return res.status(200).json({
      links: linkDetails,
      totalPages: Math.ceil(totalLinks/limit),
      message: 'Success'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server took a nap !!",
      error: err,
    });
  }
};

const getLinkAnalytics = async (req, res) => {
  try {

    if(!req.user.id){
      return res.status(401).json({message: "Get a token !!"});
    }

    const { page = 1, limit = 10, sortBy = "timestamp", order = "desc" } = req.query;

    const sortOrder = order === "asc" ? 1 : -1;


    const links = await Link.find({
      createdBy: req.user.id,
    });

    if(!links.length) {
      return res.status(404).json({
        message: "Oops!! Nothing to see",
      })
    }

    let analyticsData = [];

    links.forEach((link) => {
      link.clicks.forEach((click) => {
        analyticsData.push({
          timestamp: new Date(click.timestamp).toLocaleString('en-IN', {
            timeZone: "Asia/Kolkata",
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          originalURL: link.originalURL,
          shortURL: `${BASE_URL}/${link.shortURL}`, 
          ip: click.ip,
          device: click.device,
          browser: click.browser
        });
      });
    });

    analyticsData.sort((a, b) => sortOrder * (new Date(a.timestamp) - new Date(b.timestamp)));

    const startIndex = (page - 1) * limit;
    const paginatedData = analyticsData.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      analytics: paginatedData,
      totalEntries: analyticsData.length,
      totalPages: Math.ceil(analyticsData.length/limit)
    });
  } catch (err) {
    res.status(500).json({
      error: "Server took a nap !!",
    });
  }
};

const updateLink = async (req, res) => {
  const { id } = req.params;
  const { originalURL ,expirationDate, remarks, isExpiration } = req.body;

  if (!validator.isURL(originalURL)) {
    return res.status(400).json({field: 'originalURL', message: "Link Looks Odd" });
  }

  if(!remarks) {
    return res.status(400).json({
      field: 'remarks',
      message: "Please add a remark",
    })
  }

  if( isExpiration && !expirationDate) {
    return res.status(400).json({
      field: 'expirationDate',
      message: "No expiration date provided !!",
    })
  }

  if(expirationDate && new Date(expirationDate) <= new Date()){
    return res.status(400).json({
      field: 'expirationDate',
      message: "Future Time Please"
    });
  }

  try {
    const link = await Link.findById(id);

    if (!link) {
      return res.status(404).json({ message: "Link's gone Rouge !!" });
    }

    link.originalURL = originalURL;
    link.expirationDate = expirationDate;
    link.remarks = remarks;

    await link.save();

    return res.status(200).json({ message: "Link Locked and Reloaded", link });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server took a nap" });
  }
};

const getDashboardLinkDetails = async (req, res) => {

    const userId = req.user.id;

    if(!userId) {
        return res.status(400).json({
            message: "ID-n't Exist"
        });
    };


  try {

    const links = await Link.find({
      createdBy: req.user.id,
    });

    if (!links || links.length === 0) {
      return res.status(404).json({
        message: "Oops!! Nothing to see",
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
      message: "Hoorahh !!",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server took a nap",
    });
  }
};

const getLinkDetails = async (req, res) => {

  const {id} = req.params;

  try{
    const linkDetails = await Link.findById(id);

    if (!linkDetails) {
      return res.status(404).json({ message: "Link's gone Rouge'" });
    }

    return res.status(200).json({
      linkDetails : linkDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message : "Server took a nap"
    })
  }

}

const deleteLink = async (req, res) => {
  const { id } = req.params;

  if(!id) {
    return res.status(400).json({message: "Link ID, Please !" });
  }

  try {
    const link = await Link.findById(id);

    if (!link) {
      return res.status(404).json({ message: "Link's gone Rouge" });
    }

    await Link.findByIdAndDelete(id);

    return res.status(200).json({ message: "Link's gone, job's done" });

  } catch (err) {
    
    console.error(err);
    return res.status(500).json({ message: "Server took a nap", error: err });
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
