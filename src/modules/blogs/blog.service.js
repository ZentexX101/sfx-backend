const mongoose = require("mongoose");
const Blog = require("./blog.model");

const createBlog = async (blogData) => {
  return Blog.create(blogData);
};

const getAllBlogs = async (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filters = {};

  if (query.status) {
    filters.status = query.status;
  } else {
    filters.status = "published";
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.search) {
    filters.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { body: { $regex: query.search, $options: "i" } },
      { "author.name": { $regex: query.search, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [blogs, total] = await Promise.all([
    Blog.find(filters).sort(sort).skip(skip).limit(limit),
    Blog.countDocuments(filters),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sortBy,
      sortOrder: sortOrder === 1 ? "asc" : "desc",
      appliedFilters: {
        status: filters.status || null,
        category: query.category || null,
        search: query.search || null,
      },
    },
    data: blogs,
  };
};

const getBlogByIdentifier = async (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return Blog.findById(identifier);
  }

  return Blog.findOne({ slug: identifier.toLowerCase() });
};

const updateBlog = async (id, updateData) => {
  return Blog.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const deleteBlog = async (id) => {
  return Blog.findByIdAndDelete(id);
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogByIdentifier,
  updateBlog,
  deleteBlog,
};
