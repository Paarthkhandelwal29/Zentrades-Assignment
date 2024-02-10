const knexion = require('./db/knex');
const express = require('express');
const cors = require('cors');

// Express app setup
const app = express();
const port = 5500;

// Middleware setup
app.use(express.json());
app.use(cors());

// Endpoint to plan route
// Endpoint to plan route
app.post('/api/plan-route', async (req, res) => {
    console.log("Received request to plan route.");
    const { jobLocations, technicianLocation } = req.body;

    try {
        console.log("Technician location:", technicianLocation);
        console.log("Job locations:", jobLocations);

        // Check if jobLocations is null or undefined or not an array
        if (!Array.isArray(jobLocations) || jobLocations.length === 0) {
            throw new Error("Job locations are not provided or in an invalid format.");
        }

        // Initialize route with technician location
        let route = [technicianLocation[0]];
        let currentLocation = technicianLocation[0];

        // Iterate through job locations to find nearest location sequentially
        while (jobLocations.length > 0) {
            let minDistance = Infinity;
            let nearestJob;
            let nearestIndex;

            // Find the nearest job location to the current location
            for (let i = 0; i < jobLocations.length; i++) {
                const distance = calculateDistance(currentLocation, jobLocations[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestJob = jobLocations[i];
                    nearestIndex = i;
                }
            }

            // Add the nearest job location to the route
            route.push(nearestJob);
            console.log(route);
            // Remove the nearest job location from the list of job locations
            jobLocations.splice(nearestIndex, 1);

            // Update the current location to the nearest job location
            currentLocation = nearestJob;
        }

        // Insert data into the database
        await knexion("locations").insert({
            technician_location: JSON.stringify(technicianLocation),
            job_locations: JSON.stringify(jobLocations),
            arranged_order: JSON.stringify(route)
        });

        console.log("Data Inserted");

        // Return the calculated route
        console.log("Final route:", route);
        res.json({ route });
    } catch (error) {
        console.error('Error planning route:', error);
        res.status(500).json({ error: error.message }); // Format error message as JSON
    }
});



// Define a route handler for GET requests on the root path
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Run the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to calculate distance between two locations using Haversine formula
function calculateDistance(location1, location2) {
    const [lon1, lat1] = location1;
    const [lon2, lat2] = location2;

    // Function to convert degrees to radians
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    const R = 6371; // Radius of the earth in kilometers
    const dLat = deg2rad(lat2 - lat1); // Difference in latitude
    const dLon = deg2rad(lon2 - lon1); // Difference in longitude
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}
