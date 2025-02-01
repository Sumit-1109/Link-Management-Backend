const device = require("express-device");
const userAgent = require("express-useragent");

const deviceType = (req, res, next) => {

  const source = req.headers["user-agent"];
  const userInfo = userAgent.parse(source);

  let device = "Unknown";

  if (req.device && req.device.type) {
    switch (req.device.type) {
      case "phone":
        device = "Mobile";
        break;
      case "desktop":
        device = "Desktop";
        break;
      case "tablet":
        device = "Tablet";
        break;
    }
  }

  const browser = req.useragent.browser || "Unknown";

  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.ip;

  const userDevice = userInfo.os;

  req.clientInfo = { device, browser, userDevice, ip };

  next();
};

module.exports = deviceType;
