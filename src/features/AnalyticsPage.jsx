// -----------------------------------------------------------------------------
// Analytics Page compatibility shim
// -----------------------------------------------------------------------------
// The Analytics screen was removed from the active app navigation, but some
// deployed branches/commits may still re-export or import ./AnalyticsPage.
// Keeping this small compatibility page prevents Vite/Vercel from failing with:
// Could not resolve "./AnalyticsPage" from "src/features/Pages.jsx".
// -----------------------------------------------------------------------------

import React from "react";
import { PlaceholderPage } from "./PlaceholderPage";

function AnalyticsPage(props) {
    return <PlaceholderPage title="Analytics" {...props} />;
}

function AnalyticsPageSecure(props) {
    return <AnalyticsPage {...props} />;
}

export { AnalyticsPage, AnalyticsPageSecure };
