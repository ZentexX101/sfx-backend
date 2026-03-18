const { Readable } = require("stream");
const catchAsync = require("../../utils/catchAsync");
const sendResponse = require("../../utils/sendResponse");
const AppError = require("../../errors/AppError");
const cloudinary = require("../../config/cloudinary");
const blogService = require("./blog.service");

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sfx-blogs",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const slugify = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const parseOpenGraphTags = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (_error) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const parseSchemaMarkup = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return JSON.parse(trimmed);
  }

  return null;
};

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }

  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const ddmmyyyyMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, dd, mm, yyyy] = ddmmyyyyMatch;
    const fallbackDate = new Date(`${yyyy}-${mm}-${dd}`);

    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }

  throw new AppError(400, "Invalid publish date format");
};

const extractFile = async (req, fieldName) => {
  const file = req.files?.[fieldName]?.[0];
  if (!file) {
    return null;
  }

  const uploaded = await uploadToCloudinary(file);
  return uploaded.secure_url;
};

exports.createBlog = catchAsync(async (req, res, next) => {
  const {
    title,
    urlSlug,
    slug,
    description,
    body,
    blogBody,
    status,
    category,
    publishDate,
    publishedAt,
    authorName,
    author,
    designation,
    facebookLink,
    linkedinLink,
    twitterLink,
    metaTitle,
    canonicalUrl,
    canonicalURL,
    metaDescription,
    openGraphTags,
    tags,
    schema,
    headerImage,
    cardImage,
    authorImage,
  } = req.body;

  if (!title || !description || !(body || blogBody) || !category) {
    return next(
      new AppError(
        400,
        "Title, description, blog body, and category are required",
      ),
    );
  }

  const finalSlug = slugify(urlSlug || slug || title);
  if (!finalSlug) {
    return next(new AppError(400, "Unable to generate a valid blog slug"));
  }

  let parsedSchema = null;
  try {
    parsedSchema = parseSchemaMarkup(schema);
  } catch (_error) {
    return next(new AppError(400, "Schema must be valid JSON"));
  }

  const uploadedHeaderImage = await extractFile(req, "headerImage");
  const uploadedCardImage = await extractFile(req, "cardImage");
  const uploadedAuthorImage = await extractFile(req, "authorImage");

  const finalHeaderImage = uploadedHeaderImage || headerImage;
  const finalCardImage = uploadedCardImage || cardImage;

  if (!finalHeaderImage || !finalCardImage) {
    return next(new AppError(400, "Header image and card image are required"));
  }

  const finalAuthorName =
    authorName || (typeof author === "string" ? author : author?.name);
  if (!finalAuthorName) {
    return next(new AppError(400, "Author name is required"));
  }

  const blog = await blogService.createBlog({
    title,
    slug: finalSlug,
    description,
    body: body || blogBody,
    headerImage: finalHeaderImage,
    cardImage: finalCardImage,
    authorImage: uploadedAuthorImage || authorImage,
    status: status || "draft",
    category,
    publishedAt: parseDateInput(publishDate || publishedAt),
    author: {
      name: finalAuthorName,
      designation: designation || author?.designation,
      socialLinks: {
        facebook: facebookLink || author?.socialLinks?.facebook,
        linkedin: linkedinLink || author?.socialLinks?.linkedin,
        twitter: twitterLink || author?.socialLinks?.twitter,
      },
    },
    seo: {
      metaTitle,
      canonicalUrl: canonicalUrl || canonicalURL,
      metaDescription,
      openGraphTags: parseOpenGraphTags(openGraphTags || tags),
      schema: parsedSchema,
    },
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Blog created successfully",
    data: blog,
  });
});

exports.getAllBlogs = catchAsync(async (req, res) => {
  const result = await blogService.getAllBlogs(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blogs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

exports.getBlogByIdentifier = catchAsync(async (req, res, next) => {
  const blog = await blogService.getBlogByIdentifier(req.params.identifier);

  if (!blog) {
    return next(new AppError(404, "Blog not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog retrieved successfully",
    data: blog,
  });
});

exports.updateBlog = catchAsync(async (req, res, next) => {
  const payload = { ...req.body };
  let existingBlog = null;

  const getExistingBlog = async () => {
    if (!existingBlog) {
      existingBlog = await blogService.getBlogByIdentifier(req.params.id);
    }

    if (!existingBlog) {
      throw new AppError(404, "Blog not found");
    }

    return existingBlog;
  };

  if (payload.urlSlug || payload.slug) {
    payload.slug = slugify(payload.urlSlug || payload.slug);
    delete payload.urlSlug;

    if (!payload.slug) {
      return next(new AppError(400, "Unable to generate a valid blog slug"));
    }
  }

  if (payload.publishDate) {
    payload.publishedAt = parseDateInput(payload.publishDate);
    delete payload.publishDate;
  }

  if (payload.status === "published" && !payload.publishedAt) {
    const currentBlog = await getExistingBlog();
    payload.publishedAt = currentBlog.publishedAt || new Date();
  }

  if (payload.schema) {
    try {
      payload.schema = parseSchemaMarkup(payload.schema);
    } catch (_error) {
      return next(new AppError(400, "Schema must be valid JSON"));
    }
  }

  const headerImage = await extractFile(req, "headerImage");
  const cardImage = await extractFile(req, "cardImage");
  const authorImage = await extractFile(req, "authorImage");

  if (headerImage) {
    payload.headerImage = headerImage;
  }

  if (cardImage) {
    payload.cardImage = cardImage;
  }

  if (authorImage) {
    payload.authorImage = authorImage;
  }

  if (payload.body === undefined && payload.blogBody !== undefined) {
    payload.body = payload.blogBody;
    delete payload.blogBody;
  }

  if (
    payload.metaTitle !== undefined ||
    payload.canonicalUrl !== undefined ||
    payload.canonicalURL !== undefined ||
    payload.metaDescription !== undefined ||
    payload.openGraphTags !== undefined ||
    payload.tags !== undefined ||
    payload.schema !== undefined
  ) {
    const currentBlog = await getExistingBlog();
    const currentSeo = currentBlog.seo || {};

    payload.seo = {
      metaTitle: payload.metaTitle ?? currentSeo.metaTitle,
      canonicalUrl:
        payload.canonicalUrl ?? payload.canonicalURL ?? currentSeo.canonicalUrl,
      metaDescription: payload.metaDescription ?? currentSeo.metaDescription,
      openGraphTags:
        payload.openGraphTags !== undefined || payload.tags !== undefined
          ? parseOpenGraphTags(payload.openGraphTags || payload.tags)
          : currentSeo.openGraphTags,
      schema: payload.schema ?? currentSeo.schema,
    };

    delete payload.metaTitle;
    delete payload.canonicalUrl;
    delete payload.canonicalURL;
    delete payload.metaDescription;
    delete payload.openGraphTags;
    delete payload.tags;
    delete payload.schema;
  }

  if (
    payload.authorName !== undefined ||
    payload.author !== undefined ||
    payload.designation !== undefined ||
    payload.facebookLink !== undefined ||
    payload.linkedinLink !== undefined ||
    payload.twitterLink !== undefined
  ) {
    const currentBlog = await getExistingBlog();
    const currentAuthor = currentBlog.author || {};
    const currentSocialLinks = currentAuthor.socialLinks || {};

    payload.author = {
      name:
        payload.authorName ||
        (typeof payload.author === "string"
          ? payload.author
          : payload.author?.name) ||
        currentAuthor.name,
      designation:
        payload.designation ??
        (typeof payload.author === "object"
          ? payload.author?.designation
          : undefined) ??
        currentAuthor.designation,
      socialLinks: {
        facebook:
          payload.facebookLink ??
          (typeof payload.author === "object"
            ? payload.author?.socialLinks?.facebook
            : undefined) ??
          currentSocialLinks.facebook,
        linkedin:
          payload.linkedinLink ??
          (typeof payload.author === "object"
            ? payload.author?.socialLinks?.linkedin
            : undefined) ??
          currentSocialLinks.linkedin,
        twitter:
          payload.twitterLink ??
          (typeof payload.author === "object"
            ? payload.author?.socialLinks?.twitter
            : undefined) ??
          currentSocialLinks.twitter,
      },
    };

    delete payload.authorName;
    delete payload.author;
    delete payload.designation;
    delete payload.facebookLink;
    delete payload.linkedinLink;
    delete payload.twitterLink;
  }

  const blog = await blogService.updateBlog(req.params.id, payload);

  if (!blog) {
    return next(new AppError(404, "Blog not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog updated successfully",
    data: blog,
  });
});

exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await blogService.deleteBlog(req.params.id);

  if (!blog) {
    return next(new AppError(404, "Blog not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blog deleted successfully",
    data: null,
  });
});
