const AppError = require("../../errors/AppError");
const { StatusCodes } = require("http-status-codes");
const TestModel = require("./test.model");

const createTest = async (data) => {
    const test = await TestModel.create(data);
    return test;
};

const getSingleTest = async (id) => {
    const test = await TestModel.findById(id);

    if (!test) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            `Test with id ${id} not found`,
            `The requested test with the id ${id} could not be found in the database.`
        );
    }

    return blog;
};

module.exports = {
    createTest,
    getSingleTest,
};
