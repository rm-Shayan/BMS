import { ApiError } from "../utils/ApiError.js";

const validate = (schema) => async (req, res, next) => {
    try {
        await schema.validate({
            body: req.body,
            query: req.query,
            params: req.params,
        }, { abortEarly: false }); // abortEarly: false se saare errors ek sath milenge
        
        next();
    } catch (error) {
        // Yup ke errors ko extract karke clean message banana
        const errorMessage = error.inner.map((err) => err.message).join(", ");
        next(new ApiError(400, errorMessage));
    }
};

export default validate;