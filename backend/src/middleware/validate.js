import { ValidationError } from "../utils/errors.js";

export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          rule: e.code,
        }));
        return next(new ValidationError("Validation failed", details));
      }
      return next(err);
    }
  };
}
