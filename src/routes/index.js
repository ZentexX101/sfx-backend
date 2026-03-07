const express = require("express");
const router = express.Router();

const TestRoutes = require("../modules/test/test.routes");

const moduleRoutes = [
	{
		path: "/test",
		route: TestRoutes,
	},
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
