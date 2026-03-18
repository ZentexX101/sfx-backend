const catchAsync = require("../../utils/catchAsync");
const sendResponse = require("../../utils/sendResponse");
const dashboardService = require("./overview.service");

exports.getOverviewCards = catchAsync(async (req, res) => {
  const result = await dashboardService.getOverviewCards();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview cards retrieved successfully",
    data: result,
  });
});

exports.getReviewVolumeByWeek = catchAsync(async (req, res) => {
  const result = await dashboardService.getReviewVolumeByWeek(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard review volume retrieved successfully",
    data: result,
  });
});

exports.getReviewCharts = catchAsync(async (req, res) => {
  const result = await dashboardService.getReviewCharts();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard review charts retrieved successfully",
    data: result,
  });
});
