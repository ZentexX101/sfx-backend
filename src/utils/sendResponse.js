const sendResponse = (res, data) => {
	res.status(data.statusCode).json({
		success: data.success,
		message: data.message,
		meta: data?.meta, // optional property
		data: data.data,
	});
};
module.exports = sendResponse;
