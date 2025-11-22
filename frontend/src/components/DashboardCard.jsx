import { Card, CardContent, Typography } from "@mui/material";

function DashboardCard({ title, value }) {
  return (
    <Card sx={{ minWidth: 200, p: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" color="primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default DashboardCard;
