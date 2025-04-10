function InitializeMapAndData() {


    // Initialize Map

    var map = L.map('map', { zoomControl: false });

   /* L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
     */

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);


    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20, 
    }).addTo(map);


    // Create bounds object
    var bounds = L.latLngBounds();

    // Fetch and process product batch steps
    fetch("https://smartfarminglab.github.io/data/productpassport.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {

            // Display Product Card Info
        // document.getElementById("product-card").style.display = "grid";
            document.getElementById("product-name").textContent = data.productName;
            document.getElementById("product-category").textContent = data.category;
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            document.getElementById("production-date").textContent =
                new Date(data.productionDate).toLocaleDateString("de-DE", options);

            document.getElementById("best-before").textContent = new Date(data.bestBefore).toLocaleDateString();
            document.getElementById("company-name").textContent = data.productOwner.companyName;
            //document.getElementById("product-image").src = data.imageSrc;
            document.getElementById("product-image").src = data.imageSrc !== "string" ? data.imageSrc : "https://via.placeholder.com/100";



            // Load Certificates
            let certificateContainer = document.getElementById("certificates");
            certificateContainer.innerHTML = "";
            data.certificates.forEach(cert => {
                let img = document.createElement("img");
                img.src = cert.imageSrc;
                img.title = cert.name;
                img.onclick = () => window.open(cert.link, "_blank");
                certificateContainer.appendChild(img);
            });

            if (!data.productBatchSteps || data.productBatchSteps.length === 0) {
                console.warn("No product batch steps found.");
                map.setView([51.1657, 10.4515], 6); // Fallback center
                return;
            }


            // Clustergruppe initialisieren
            const markerClusterGroup = L.markerClusterGroup();

            let polylinePoints = [];
            data.productBatchSteps.forEach(step => {
                if (step.address && step.address.latitude && step.address.longitude) {
                    var marker = L.marker([step.address.latitude, step.address.longitude], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: `<div></div>`,
                            iconSize: [25, 25],
                            popupAnchor: [0, -10]
                        })
                    }).on('click', function (e) {
                        showSidebarWithStep(step);
                    });//.addTo(map)
                    //.bindPopup(`<b>${step.name}</b><br>${step.address.name}, ${step.address.city}`);


                    // Zur Clustergruppe hinzufügen
                    markerClusterGroup.addLayer(marker);

                    // Extend bounds
                    bounds.extend([step.address.latitude, step.address.longitude]);
                    polylinePoints.push([step.address.latitude, step.address.longitude]);
                }
            });


            // Cluster zur Karte hinzufügen
            map.addLayer(markerClusterGroup);


            const animateWithCSS = true; // auf false setzen für Punkt-für-Punkt-Zeichnung

            if (polylinePoints.length > 1) {
                for (let i = 0; i < polylinePoints.length - 1; i++) {
                    const start = polylinePoints[i];
                    const end = polylinePoints[i + 1];

                    // Midpoint mit Kurven-Offset berechnen
                    const offsetX = end[1] - start[1];
                    const offsetY = end[0] - start[0];
                    const r = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
                    const theta = Math.atan2(offsetY, offsetX);
                    const thetaOffset = Math.PI / 10;

                    const r2 = (r / 2) / Math.cos(thetaOffset);
                    const theta2 = theta + thetaOffset;

                    const midpointX = (r2 * Math.cos(theta2)) + start[1];
                    const midpointY = (r2 * Math.sin(theta2)) + start[0];
                    const midpointLatLng = [midpointY, midpointX];

                    const pathOptions = {
                        color: '#3c8138',
                        weight: 2,
                        opacity: 0.8,
                    };

                    if (animateWithCSS) {
                        // CSS-animated
                        const curvedPath = L.curve([
                            'M', start,
                            'Q', midpointLatLng,
                            end
                        ], pathOptions).addTo(map);

                        setTimeout(() => {
                            if (curvedPath._path) {
                                const path = curvedPath._path;
                                const length = path.getTotalLength();

                                path.style.strokeDasharray = length;
                                path.style.strokeDashoffset = length;
                                path.style.animation = `drawLine 2s ease forwards`;
                            }
                        }, 0); // sicherstellen, dass _path verfügbar ist


                    } else {
                        //  Punkt-für-Punkt Zeichnung mit interpolierter Polyline
                        const numSteps = 100;
                        const latlngs = [];
                        for (let t = 0; t <= 1; t += 1 / numSteps) {
                            // Quadratische Bézier-Interpolation
                            const x = Math.pow(1 - t, 2) * start[1] +
                                2 * (1 - t) * t * midpointLatLng[1] +
                                Math.pow(t, 2) * end[1];
                            const y = Math.pow(1 - t, 2) * start[0] +
                                2 * (1 - t) * t * midpointLatLng[0] +
                                Math.pow(t, 2) * end[0];
                            latlngs.push([y, x]);
                        }

                        const animatedLine = L.polyline([], pathOptions).addTo(map);

                        let i = 0;
                        const interval = setInterval(() => {
                            if (i < latlngs.length) {
                                animatedLine.addLatLng(latlngs[i]);


                                i++;
                            } else {
                                clearInterval(interval);
                            }
                        }, 10); // Geschwindigkeit der Animation
                    }
                }
            }






            // Fit bounds to show all points
            if (bounds.isValid()) {
                //map.fitBounds(bounds);
                const zoom = map.getBoundsZoom(bounds);
                map.setView(bounds.getCenter(), zoom - 1); // Zoom um 1 verringert

            } else {
                console.warn("No valid coordinates found.");
                map.setView([51.1657, 10.4515], 6); // Default to Germany
            }
        })
        .catch(error => console.error("Error loading data:", error));

}