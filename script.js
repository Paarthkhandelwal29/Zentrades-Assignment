// Initialize Mapbox
console.log("Initializing Mapbox...")
mapboxgl.accessToken = "pk.eyJ1IjoibWFuZWthMDUiLCJhIjoiY2xzZDZ6Y2RqMHFlcjJscGNsbjNtNHBpbyJ9.xrcP-na9H_iyDEedXHP5fA"

// Create the map
console.log("Creating map...")
let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v11",
  center: [0, 0],
  zoom: 0,
})

map.addControl(new mapboxgl.NavigationControl(), "bottom-left")

// Log map object for debugging
console.log("Map object:", map)

// Array to store job locations
let calculatedRoute = [];
let jobLocations = []
let technicianLocations = []

// Function to add job location with pointer on the map
async function addJobLocation() {
  console.log("Adding job location...")
  let jobLocationInput = document.getElementById("jobLocation").value
  console.log("Job location input:", jobLocationInput)
  if (jobLocationInput.trim() !== "") {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${jobLocationInput}.json?access_token=${mapboxgl.accessToken}`
      )
      const data = await response.json()
      const coordinates = data.features[0].center
      jobLocations.push(coordinates)
      // Add pointer marker on the map
      console.log(coordinates)
      //   new mapboxgl.Marker().setLngLat(coordinates).addTo(map)
      const marker = new mapboxgl.Marker({
        color: "red",
        scale: 3,
      })
        .setLngLat(coordinates)
        .addTo(map)
      marker.getElement().addEventListener("click", () => {
        console.log(marker.getOffset())
      })
      map.setCenter(coordinates)
      map.setZoom(12)
      console.log("Job location added successfully.")
    } catch (error) {
      console.error("Error adding job location:", error)
    }
  }
}

// Function to plan route with pointers on the map
async function planRoute() {
  console.log("Planning route...");
  let technicianLocationStr = document.getElementById("technicianLocation").value;
  console.log("Technician location:", technicianLocationStr);
  if (technicianLocationStr.trim() === "") {
    alert("Please enter technician location");
    return;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${technicianLocationStr}.json?access_token=${mapboxgl.accessToken}`
    )
    const data = await response.json()
    const coordinates = data.features[0].center
    technicianLocations.push([coordinates[0], coordinates[1]]);
    // Add pointer marker on the map
    console.log(coordinates)
    //   new mapboxgl.Marker().setLngLat(coordinates).addTo(map)
    const marker = new mapboxgl.Marker({
      color: "blue",
      scale: 3,
    })
      .setLngLat(coordinates)
      .addTo(map)
    marker.getElement().addEventListener("click", () => {
      console.log(marker.getOffset())
    })
    map.setCenter(coordinates)
    map.setZoom(12)
    console.log("Job location added successfully.")
  } catch (error) {
    console.error("Error adding job location:", error)
  }
  
  // Make API call to backend with jobLocations and technicianLocation
  fetch("http://localhost:5500/api/plan-route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobLocations: jobLocations,
      technicianLocation: technicianLocations, // Pass array of coordinates
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      calculatedRoute = data.route;
      console.log("Route planned successfully:", data.route);
      // Display the route on the map along with the technician's location
      displayRoute(data.route, technicianLocations[0]);
      setInterval(()=>{
        window.stop()
      }, 3600000000000)
    })
    .catch((error) => {
      console.error("Error planning route:", error);
    });
}

// Function to display route on the map
function displayRoute(route, technicianLocation) {
  // Add a check to ensure route is not null or undefined
  if (route) {
    // Clear previous route if any
    map.getSource("route").setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route,
      },
    });
    
    // Add a marker for the technician's location
    new mapboxgl.Marker({
      color: "blue", // Set marker color
      scale: 3,
    })
    .setLngLat(technicianLocation) // Set marker coordinates
    .addTo(map);
    
    console.log("Route displayed on the map:", route);
  } else {
    console.error("Route is null or undefined");
  }
  return false;
}

// Add event listener for input event on job location input field
document
  .getElementById("jobLocation")
  .addEventListener("input", autocompleteJobLocation)

// Add event listener for input event on technician location input field
document
  .getElementById("technicianLocation")
  .addEventListener("input", autocompleteTechnicianLocation)

// Function to fetch autocomplete suggestions for job location input
async function autocompleteJobLocation() {
  console.log("Autocompleting job location...")
  let jobLocationInput = document.getElementById("jobLocation").value
  console.log("Job location input:", jobLocationInput)
  if (jobLocationInput.trim() !== "") {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${jobLocationInput}.json?access_token=${mapboxgl.accessToken}`
      )
      const data = await response.json()
      const suggestions = data.features.map((feature) => feature.place_name)
      console.log("Autocomplete suggestions:", suggestions)
      displayAutocompleteSuggestions(suggestions)
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error)
    }
  } else {
    clearAutocompleteSuggestions()
  }
}

// Function to fetch autocomplete suggestions for technician location input
async function autocompleteTechnicianLocation() {
  console.log("Autocompleting technician location...")
  let technicianLocationInput =
    document.getElementById("technicianLocation").value
  console.log("Technician location input:", technicianLocationInput)
  if (technicianLocationInput.trim() !== "") {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${technicianLocationInput}.json?access_token=${mapboxgl.accessToken}`
      )
      const data = await response.json()
      const suggestions = data.features.map((feature) => feature.place_name)
      console.log("Autocomplete suggestions:", suggestions)
      displayTechnicianAutocompleteSuggestions(suggestions)
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error)
    }
  } else {
    clearTechnicianAutocompleteSuggestions()
  }
}

// Function to display autocomplete suggestions below the job location input field
function displayAutocompleteSuggestions(suggestions) {
  console.log("Displaying job location autocomplete suggestions:", suggestions)
  let autocompleteList = document.getElementById("autocompleteList")
  autocompleteList.innerHTML = ""
  suggestions.forEach((suggestion) => {
    let listItem = document.createElement("li")
    listItem.textContent = suggestion
    listItem.addEventListener("click", () => {
      document.getElementById("jobLocation").value = suggestion
      clearAutocompleteSuggestions()
    })
    autocompleteList.appendChild(listItem)
  })
}

// Function to display autocomplete suggestions below the technician location input field
function displayTechnicianAutocompleteSuggestions(suggestions) {
  console.log(
    "Displaying technician location autocomplete suggestions:",
    suggestions
  )
  let technicianAutocompleteList = document.getElementById(
    "technicianAutocompleteList"
  )
  technicianAutocompleteList.innerHTML = ""
  suggestions.forEach((suggestion) => {
    let listItem = document.createElement("li")
    listItem.textContent = suggestion
    listItem.addEventListener("click", () => {
      document.getElementById("technicianLocation").value = suggestion
      clearTechnicianAutocompleteSuggestions()
    })
    technicianAutocompleteList.appendChild(listItem)
  })
}

// Function to clear autocomplete suggestions for job location
function clearAutocompleteSuggestions() {
  console.log("Clearing job location autocomplete suggestions.")
  document.getElementById("autocompleteList").innerHTML = ""
}

// Function to clear autocomplete suggestions for technician location
function clearTechnicianAutocompleteSuggestions() {
  console.log("Clearing technician location autocomplete suggestions.")
  document.getElementById("technicianAutocompleteList").innerHTML = ""
}

// Update map initialization to include a source for route
map.on("load", () => {
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [calculatedRoute],
      },
    },
  })

  // Add layer for displaying the route
  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#3887be",
      "line-width": 5,
      "line-opacity": 0.75,
    },
  })
})