import React, { useState } from "react";
import { Modal, Box, Typography, Rating, TextField, Button } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  "& .MuiButton-root": {
    textTransform: "none", // Match Tailwind button style
    fontWeight: 500,
  },
};

const ReviewModal = ({ orderId, serviceId, serviceTitle, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5.");
      return;
    }
    if (!serviceId) {
      console.error("ReviewModal: serviceId is undefined");
      alert("Cannot submit review: Service ID is missing.");
      return;
    }
    setSubmitting(true);
    try {
      console.log(`Submitting review for orderId: ${orderId}, serviceId: ${serviceId}`);
      await onSubmit({ orderId, serviceId, rating, comment });
      setRating(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Review submission error:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!orderId} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: "#111827" }}>
          Review Seller for {serviceTitle || "Order"}
        </Typography>
        <Typography sx={{ mb: 2, color: "#6B7280" }}>
          Please rate your experience with the seller for this order.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            precision={1}
            sx={{ mb: 2, color: "#FBBF24" }} // Match Tailwind yellow-400
          />
          <TextField
            fullWidth
            label="Comment (optional)"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 1000 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
              disabled={submitting}
              sx={{ color: "#6B7280", borderColor: "#D1D5DB", "&:hover": { borderColor: "#9CA3AF" } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || rating === 0}
              sx={{ bgcolor: "#06B6D4", "&:hover": { bgcolor: "#0891B2" }, "&:disabled": { bgcolor: "#D1D5DB" } }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default ReviewModal;