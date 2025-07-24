window.HELP_IMPROVE_VIDEOJS = false;

// Initialize when page loads
$(document).ready(function() {
    // Check if running on mobile device
    var isMobile = window.innerWidth < 768;
    
    // Initialize components based on device
    if (!isMobile) {
        // Initialize carousels only on desktop
        var carousels = bulmaCarousel.attach('.carousel', {
            slidesToScroll: 1,
            slidesToShow: 3,
            infinite: true,
        });
    }

    // Initialize sliders
    var sliders = bulmaSlider.attach();

    // Load and display data
    loadDatasetVisualizations();
});

// Dataset visualization functions
function loadDatasetVisualizations() {
    console.log('Loading dataset visualizations...');
    
    // Initialize data visualizations immediately
    
    // Load camera images
    loadCameraImages();
    
    // Initialize 3D point cloud viewer
    // 3D point cloud viewer removed - using static registration image instead
    
    // Load GPS trajectory immediately
    loadAllSynchronizedData();
    
    // Load sensor timeline
    loadSensorTimeline();
}

// Global synchronized playback variables
let syncPlayback = {
    isPlaying: false,
    currentTime: 0,
    totalDuration: 20, // 20 second demo
    videoMetadata: null,
            gpsData: null,
        imuData: null,
    animationFrame: null
};

function loadCameraImages() {
    console.log('🎬 loadCameraImages() called - should load videos!');
    // Load synchronized video data instead of static images
    loadSynchronizedCameraVideos();
}

function loadSynchronizedCameraVideos() {
    console.log('🎬 STARTING loadSynchronizedCameraVideos()');
    
    // First, try direct video creation since we know the files exist
    createDirectVideoGrid();
    
    // Then load metadata for synchronization
    fetch('./static/sync_data_20sec/video_metadata.json')
        .then(response => {
            console.log('📡 Fetched video metadata, status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('📋 Video metadata loaded successfully:', data);
            syncPlayback.videoMetadata = data;
            syncPlayback.totalDuration = data.duration_seconds;
            // Don't recreate grid, just update metadata
            console.log('✅ Synchronized camera videos loaded (20sec demo) with', Object.keys(data.cameras).length, 'cameras');
        })
        .catch(error => {
            console.log('❌ 20sec metadata failed:', error);
            console.log('Trying full dataset...');
            fetch('./static/sync_data/video_metadata.json')
                .then(response => response.json())
                .then(data => {
                    syncPlayback.videoMetadata = data;
                    syncPlayback.totalDuration = data.duration_seconds;
                    console.log('✅ Full dataset metadata loaded');
                })
                .catch(error => {
                    console.log('❌ All metadata failed:', error);
                    // Videos should still be there from createDirectVideoGrid()
                });
        });
}

function createDirectVideoGrid() {
    console.log('🎯 Creating single composite video...');
    
    const cameraGrid = $('#camera-grid');
    const dataPath = './static/sync_data_20sec';
    
    cameraGrid.empty(); // Clear any existing content
    
    // Single composite video with all 6 camera views
    const videoSrc = `${dataPath}/videos/multicamera_composite.mp4`;
    console.log(`🎥 Creating composite video: ${videoSrc}`);
    
    const compositeVideoElement = `
        <div class="column is-full">
            <div class="sensor-card">
                <div style="position: relative; background: #000; width: 100%; max-width: 1920px; margin: 0 auto;">
                    <video id="sync-camera-composite" 
                           src="${videoSrc}"
                           style="width: 100%; height: auto; object-fit: contain;"
                           muted loop preload="metadata" controls>
                        Your browser does not support video playback.
                    </video>

                </div>
            </div>
        </div>
    `;
    
    cameraGrid.append(compositeVideoElement);
    
    console.log('✅ Composite video created - all cameras in sync!');
}

function createSynchronizedCameraGrid(videoMetadata) {
    const cameraGrid = $('#camera-grid');
    
    // Determine data path - prefer 20sec demo
    const dataPath = './static/sync_data_20sec';
    
    const cameras = [
        { key: 'front', name: 'Front (ZED)' },
        { key: 'rear_left', name: 'Rear Left' },
        { key: 'rear_mid', name: 'Rear Mid' },
        { key: 'rear_right', name: 'Rear Right' },
        { key: 'side_left', name: 'Side Left' },
        { key: 'side_right', name: 'Side Right' }
    ];
    
    cameras.forEach((camera, index) => {
        const cameraData = videoMetadata.cameras[camera.key];
        if (cameraData) {
            console.log(`Creating camera element for ${camera.key}:`, cameraData);
            
            // Force use video files (we know they exist)
            const hasVideoFile = cameraData.video_file && cameraData.video_file.endsWith('.mp4');
            
            let mediaElement;
            if (hasVideoFile) {
                const videoSrc = `${dataPath}/videos/${cameraData.video_file}`;
                console.log(`Creating VIDEO element for ${camera.key}: ${videoSrc}`);
                mediaElement = `
                    <video id="sync-camera-${camera.key}" 
                           src="${videoSrc}"
                           style="width: 100%; height: 100%; object-fit: cover;"
                           muted loop preload="metadata" controls>
                        Your browser does not support video playback.
                    </video>`;
            } else {
                console.log(`Falling back to IMAGE for ${camera.key} - no video file found`);
                // Fall back to image simulation
                mediaElement = `
                    <img id="sync-camera-${camera.key}" 
                         src="${dataPath}/frames/frame_${camera.key}_0000.jpg" 
                         alt="${camera.name} view" 
                         style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            
            const cameraElement = `
                <div class="column is-half-tablet is-one-third-desktop">
                    <div class="sensor-card">
                        <h5 class="title is-6">${camera.name}</h5>
                        <div class="image is-16by9" style="position: relative; background: #000;">
                            ${mediaElement}
                            <div style="position: absolute; bottom: 5px; left: 5px; color: white; 
                                        background: rgba(0,0,0,0.7); padding: 2px 6px; font-size: 12px; border-radius: 3px;">
                                Time: <span id="time-${camera.key}">00:00</span> / ${Math.floor(videoMetadata.duration_seconds)}s
                            </div>
                            <div style="position: absolute; top: 5px; left: 5px; color: white; 
                                        background: rgba(0,0,0,0.7); padding: 2px 6px; font-size: 12px; border-radius: 3px;">
                                ${hasVideoFile ? '📹 Real Video' : '📸 Simulated'}
                            </div>
                        </div>
                        <p class="has-text-grey-light is-size-7 mt-2">Synchronized Camera Feed</p>
                        <p class="has-text-info is-size-7">${Math.floor(videoMetadata.duration_seconds)}s @ ${Math.round(cameraData.fps || 1)} FPS</p>
                    </div>
                </div>
            `;
            cameraGrid.append(cameraElement);
        }
    });
}

// Playback controls removed - data is displayed immediately

// Removed startSyncPlayback function

// Removed startAllVideos and createDemoPlayback functions

// Removed pause, reset, and playback control functions

// Removed syncPlaybackLoop and update functions

async function loadAllSynchronizedData() {
    console.log('Loading all synchronized data...');
    
    try {
        // Try 20sec data first, fall back to full dataset
        let dataPath = './static/sync_data_20sec';
        try {
            const testResponse = await fetch(`${dataPath}/gps_data.json`);
            if (!testResponse.ok) throw new Error('20sec data not found');
            console.log('Using 20-second demo dataset');
        } catch {
            dataPath = './static/sync_data';
            console.log('Using full dataset');
        }
        
        // Embedded GPS data (for direct HTML file opening)
        syncPlayback.gpsData = [
          {
            "time": 0.0,
            "latitude": 51.26640244960987,
            "longitude": 12.489206376465123,
            "altitude": 100.0
          },
          {
            "time": 1.5,
            "latitude": 51.266360072627755,
            "longitude": 12.489295311494313,
            "altitude": 100.0
          },
          {
            "time": 3.01,
            "latitude": 51.266322395092345,
            "longitude": 12.489376160246966,
            "altitude": 100.0
          },
          {
            "time": 4.5,
            "latitude": 51.266279063992414,
            "longitude": 12.489467845654776,
            "altitude": 100.0
          },
          {
            "time": 6.0,
            "latitude": 51.26623857650338,
            "longitude": 12.489542181005403,
            "altitude": 100.0
          },
          {
            "time": 7.5,
            "latitude": 51.26619593949277,
            "longitude": 12.489612831093622,
            "altitude": 100.0
          },
          {
            "time": 9.0,
            "latitude": 51.26615656696664,
            "longitude": 12.489671085548022,
            "altitude": 100.0
          },
          {
            "time": 10.5,
            "latitude": 51.26611683926812,
            "longitude": 12.489711835950454,
            "altitude": 100.0
          },
          {
            "time": 12.0,
            "latitude": 51.26607511116458,
            "longitude": 12.48974502416033,
            "altitude": 100.0
          },
          {
            "time": 13.5,
            "latitude": 51.266038348904054,
            "longitude": 12.48977080455173,
            "altitude": 100.0
          },
          {
            "time": 15.0,
            "latitude": 51.26600320529556,
            "longitude": 12.489800912555115,
            "altitude": 100.0
          },
          {
            "time": 16.5,
            "latitude": 51.26596389844032,
            "longitude": 12.489844635520546,
            "altitude": 100.0
          },
          {
            "time": 18.0,
            "latitude": 51.26591657759065,
            "longitude": 12.48991267062156,
            "altitude": 100.0
          },
          {
            "time": 18.74,
            "latitude": 51.26588810386015,
            "longitude": 12.48995865032001,
            "altitude": 100.0
          }
        ];
        
        // IMU data fallback (simplified for direct HTML opening)
        syncPlayback.imuData = [
          {
            "time": 0.0,
            "accel_x": 0.05,
            "accel_y": 0.03,
            "accel_z": 9.8
          }
        ];
        
        // Point cloud metadata not needed - using static registration image instead
        
        // Store data path for later use
        syncPlayback.dataPath = dataPath;
        
        // Initialize GPS plot immediately
        initializeLiveGPSPlot();
        
        console.log('All synchronized data loaded successfully');
        
    } catch (error) {
        console.error('Error loading synchronized data:', error);
    }
}

function loadFallbackCameraImages() {
    // Fallback to static images if synchronized data not available
    const cameras = [
        { name: "Rear Left", file: "rear_left_real.jpg" },
        { name: "Rear Mid", file: "rear_mid_real.jpg" },
        { name: "Rear Right", file: "rear_right_real.jpg" },
        { name: "Side Left", file: "side_left_real.jpg" },
        { name: "Side Right", file: "side_right_real.jpg" }
    ];

    const cameraGrid = $('#camera-grid');
    
    cameras.forEach((camera, index) => {
        const cameraElement = `
            <div class="column is-one-third">
                <div class="sensor-card">
                    <h5 class="title is-6">${camera.name}</h5>
                    <div class="image is-16by9">
                        <img src="./static/images/${camera.file}" 
                             alt="${camera.name} view" style="object-fit: cover;">
                    </div>
                    <p class="has-text-grey-light is-size-7 mt-2">Static image</p>
                </div>
            </div>
        `;
        cameraGrid.append(cameraElement);
    });
}

// Removed formatTime function

function init3DPointCloudViewer() {
    const container = document.getElementById('pointcloud-container');
    if (!container) return;

    // Guard against multiple initializations
    if (window.pointCloudInitialized) {
        console.log('3D Point Cloud viewer already initialized, skipping...');
        return;
    }

    console.log('Initializing 3D Point Cloud viewer...');

    // Clean up any existing content to prevent stacking
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Clean up existing Three.js objects
    if (window.pointCloudScene) {
        // Cancel any existing animation frame
        if (window.pointCloudScene.animationId) {
            cancelAnimationFrame(window.pointCloudScene.animationId);
        }
        
        // Dispose of existing renderer
        if (window.pointCloudScene.renderer) {
            window.pointCloudScene.renderer.dispose();
            if (window.pointCloudScene.renderer.domElement && window.pointCloudScene.renderer.domElement.parentNode) {
                window.pointCloudScene.renderer.domElement.parentNode.removeChild(window.pointCloudScene.renderer.domElement);
            }
        }
        
        // Clear existing scene objects
        if (window.pointCloudScene.scene) {
            window.pointCloudScene.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            // Clear all children
            while (window.pointCloudScene.scene.children.length > 0) {
                window.pointCloudScene.scene.remove(window.pointCloudScene.scene.children[0]);
            }
        }
        
        // Dispose of controls
        if (window.pointCloudScene.controls) {
            window.pointCloudScene.controls.dispose();
        }
        
        // Clear the scene reference
        window.pointCloudScene = null;
        window.pointCloudInitialized = false;
    }

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Initialize synchronized point cloud (will be updated in real-time)
    initializeLivePointCloud(scene);

    // Position camera
    camera.position.set(10, 10, 10);
    controls.update();

    // Store references for synchronized updates
    window.pointCloudScene = {
        scene: scene,
        camera: camera,
        renderer: renderer,
        controls: controls,
        currentPointCloud: null,
        animationId: null
    };

    // Animation loop
    function animate() {
        window.pointCloudScene.animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    // Set initialization flag
    window.pointCloudInitialized = true;

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });

    console.log('3D Point Cloud viewer initialized');
}

function loadEnhancedPointCloud(scene) {
    // Try to load enhanced point cloud data
    fetch('./static/data/enhanced_pointcloud.json')
        .then(response => response.json())
        .then(data => {
            createPointCloudFromData(scene, data);
            console.log(`Loaded enhanced point cloud with ${data.total_points} points`);
        })
        .catch(error => {
            console.log('Enhanced point cloud not found, using sample data');
            createSamplePointCloud(scene);
        });
}

function createPointCloudFromData(scene, data) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    // Use the enhanced point cloud data
    data.points.forEach((point, index) => {
        vertices.push(point[0], point[1], point[2]);
        
        // Use provided colors or default
        if (data.colors && data.colors[index]) {
            colors.push(data.colors[index][0], data.colors[index][1], data.colors[index][2]);
        } else {
            colors.push(0.5, 0.7, 0.3); // Default agricultural green
        }
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ 
        size: 0.15, 
        vertexColors: true,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Add info text
    addPointCloudInfo(data);
}

function addPointCloudInfo(data) {
    const container = document.getElementById('pointcloud-container');
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.color = 'white';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    infoDiv.style.padding = '8px';
    infoDiv.style.borderRadius = '4px';
    infoDiv.innerHTML = `
        <strong>Enhanced Point Cloud</strong><br>
        Points: ${data.total_points.toLocaleString()}<br>
        Frames: ${data.frame_count}<br>
        Real Ouster LiDAR Data
    `;
    container.style.position = 'relative';
    container.appendChild(infoDiv);
}

function createSamplePointCloud(scene) {
    // Fallback sample point cloud for demonstration
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    // Generate sample agricultural scene points
    for (let i = 0; i < 10000; i++) {
        // Ground points
        if (Math.random() < 0.4) {
            vertices.push((Math.random() - 0.5) * 50); // x
            vertices.push(-2 + Math.random() * 2);      // y (ground level)
            vertices.push((Math.random() - 0.5) * 50); // z
            colors.push(0.4, 0.6, 0.3); // Green-brown for ground
        }
        // Vegetation points
        else if (Math.random() < 0.7) {
            vertices.push((Math.random() - 0.5) * 30);
            vertices.push(Math.random() * 8);
            vertices.push((Math.random() - 0.5) * 30);
            colors.push(0.2, 0.8, 0.2); // Green for vegetation
        }
        // Sky/noise points
        else {
            vertices.push((Math.random() - 0.5) * 60);
            vertices.push(5 + Math.random() * 10);
            vertices.push((Math.random() - 0.5) * 60);
            colors.push(0.7, 0.8, 0.9); // Light blue for sky
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ 
        size: 0.1, 
        vertexColors: true,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
}

function loadGPSTrajectory() {
    // Try to load enhanced GPS data
    fetch('./static/data/gps_trajectory.json')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                createEnhancedGPSMap(data);
                console.log(`Loaded enhanced GPS trajectory with ${data.length} points`);
            } else {
                createSampleGPSMap();
            }
        })
        .catch(error => {
            console.log('Enhanced GPS data not found, using sample data');
            createSampleGPSMap();
        });
}

function createEnhancedGPSMap(gpsData) {
    const mapData = [{
        type: 'scattermapbox',
        lat: gpsData.map(point => point.latitude),
        lon: gpsData.map(point => point.longitude),
        mode: 'markers+lines',
        marker: {
            size: 6,
            color: gpsData.map(point => point.time_seconds),
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {
                title: 'Time (s)',
                x: 1.02
            }
        },
        line: {
            color: 'blue',
            width: 3
        },
        name: 'Vehicle Trajectory',
        hovertemplate: 'Lat: %{lat:.6f}<br>Lon: %{lon:.6f}<br>Time: %{marker.color:.1f}s<extra></extra>'
    }];

    // Calculate map center
    const centerLat = gpsData.reduce((sum, point) => sum + point.latitude, 0) / gpsData.length;
    const centerLon = gpsData.reduce((sum, point) => sum + point.longitude, 0) / gpsData.length;

    const layout = {
        mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 15
        },
        margin: { r: 50, t: 0, l: 0, b: 0 },
        showlegend: false,
        title: {
            text: `Agricultural Field GPS Trajectory (${gpsData.length} points)`,
            x: 0.5,
            font: { size: 14 }
        }
    };

    Plotly.newPlot('gps-map', mapData, layout, {responsive: true});
    
    // Add GPS analysis info
    loadGPSAnalysis();
}

function loadGPSAnalysis() {
    fetch('./static/data/gps_analysis.json')
        .then(response => response.json())
        .then(data => {
            addGPSAnalysisInfo(data);
        })
        .catch(error => {
            console.log('GPS analysis not found');
        });
}

function addGPSAnalysisInfo(analysis) {
    const mapContainer = document.getElementById('gps-map');
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.right = '10px';
    infoDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
    infoDiv.style.padding = '10px';
    infoDiv.style.borderRadius = '8px';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    infoDiv.innerHTML = `
        <strong>Trajectory Analysis</strong><br>
        Distance: ${(analysis.total_distance_m / 1000).toFixed(2)} km<br>
        Duration: ${Math.round(analysis.duration_s / 60)} min<br>
        Avg Speed: ${(analysis.avg_speed_ms * 3.6).toFixed(1)} km/h<br>
        Max Speed: ${(analysis.max_speed_ms * 3.6).toFixed(1)} km/h<br>
        Path Efficiency: ${(analysis.path_efficiency * 100).toFixed(1)}%
    `;
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(infoDiv);
}

function createSampleGPSMap() {
    // Fallback sample GPS data
    const sampleGPSData = [
        { lat: 51.3397, lng: 12.3731, time: 0 },
        { lat: 51.3398, lng: 12.3732, time: 30 },
        { lat: 51.3399, lng: 12.3733, time: 60 },
        { lat: 51.3400, lng: 12.3734, time: 90 },
        { lat: 51.3401, lng: 12.3735, time: 120 },
        { lat: 51.3402, lng: 12.3736, time: 150 },
        { lat: 51.3403, lng: 12.3737, time: 180 }
    ];

    const mapData = [{
        type: 'scattermapbox',
        lat: sampleGPSData.map(point => point.lat),
        lon: sampleGPSData.map(point => point.lng),
        mode: 'markers+lines',
        marker: {
            size: 8,
            color: 'red'
        },
        line: {
            color: 'blue',
            width: 3
        },
        name: 'Vehicle Trajectory'
    }];

    const layout = {
        mapbox: {
            style: 'open-street-map',
            center: { lat: 51.3400, lon: 12.3734 },
            zoom: 16
        },
        margin: { r: 0, t: 0, l: 0, b: 0 },
        showlegend: false
    };

    Plotly.newPlot('gps-map', mapData, layout, {responsive: true});
    console.log('Sample GPS trajectory loaded');
}

function loadSensorTimeline() {
    // Try to load enhanced sensor timeline data
    fetch('./static/data/enhanced_sensor_timeline.json')
        .then(response => response.json())
        .then(data => {
            if (data && Object.keys(data).length > 0) {
                createEnhancedSensorTimeline(data);
                console.log(`Loaded enhanced sensor timeline with ${Object.keys(data).length} topics`);
            } else {
                createSampleSensorTimeline();
            }
        })
        .catch(error => {
            console.log('Enhanced sensor timeline not found, using sample data');
            createSampleSensorTimeline();
        });
}

function createEnhancedSensorTimeline(sensorData) {
    const timelineData = [];
    const sensorNames = [];
    
    // Process sensor data
    Object.entries(sensorData).forEach(([topic, stats]) => {
        const sensorName = getSensorDisplayName(topic);
        sensorNames.push(sensorName);
        
        const startTime = 0;
        const endTime = stats.duration_s || 300;
        
        timelineData.push({
            x: [startTime, endTime],
            y: [sensorName, sensorName],
            mode: 'lines',
            line: { 
                width: 8, 
                color: getSensorColor(topic)
            },
            name: `${sensorName} (${stats.count} msgs)`,
            hovertemplate: `${sensorName}<br>Frequency: ${stats.frequency_hz.toFixed(1)} Hz<br>Messages: ${stats.count}<br>Duration: ${endTime.toFixed(1)}s<extra></extra>`
        });
    });

    const layout = {
        title: 'Enhanced Sensor Data Timeline',
        xaxis: { 
            title: 'Time (seconds)',
            range: [0, Math.max(...Object.values(sensorData).map(s => s.duration_s || 300))]
        },
        yaxis: { 
            title: 'Sensors',
            categoryorder: 'array',
            categoryarray: sensorNames.reverse()
        },
        margin: { l: 150, r: 50, t: 50, b: 50 },
        showlegend: true,
        legend: { x: 1.02, y: 1 },
        height: 400
    };

    Plotly.newPlot('sensor-timeline', timelineData, layout, {responsive: true});
}

function getSensorDisplayName(topic) {
    if (topic.includes('/camera/')) {
        if (topic.includes('rear_left')) return 'Camera (Rear Left)';
        if (topic.includes('rear_mid')) return 'Camera (Rear Mid)';
        if (topic.includes('rear_right')) return 'Camera (Rear Right)';
        if (topic.includes('side_left')) return 'Camera (Side Left)';
        if (topic.includes('side_right')) return 'Camera (Side Right)';
        return 'Camera';
    }
    if (topic.includes('/zed/')) return 'ZED Stereo Camera';
    if (topic.includes('/ouster/points')) return 'LiDAR (Ouster)';
    if (topic.includes('/ouster/imu')) return 'IMU (Ouster)';
    if (topic.includes('/novatel/')) {
        if (topic.includes('fix')) return 'GPS/INS (NavSat)';
        if (topic.includes('bestpos')) return 'GPS/INS (BestPos)';
        return 'GPS/INS';
    }
    if (topic.includes('/tf')) return 'Transform (TF)';
    return topic.split('/').pop() || 'Unknown';
}

function getSensorColor(topic) {
    if (topic.includes('/camera/')) return '#FF6B6B';
    if (topic.includes('/zed/')) return '#4ECDC4';
    if (topic.includes('/ouster/points')) return '#45B7D1';
    if (topic.includes('/ouster/imu')) return '#96CEB4';
    if (topic.includes('/novatel/')) return '#FECA57';
    if (topic.includes('/tf')) return '#DDA0DD';
    return '#95A5A6';
}

function createSampleSensorTimeline() {
    // Fallback sample sensor timing data
    const sensors = [
        { name: 'Camera (Rear)', freq: '~22 Hz', count: 7203 },
        { name: 'Camera (ZED)', freq: '~19 Hz', count: 6216 },
        { name: 'LiDAR (Ouster)', freq: '~4 Hz', count: 1234 },
        { name: 'GPS/INS', freq: '~26 Hz', count: 8152 },
        { name: 'IMU', freq: '~125 Hz', count: 39370 }
    ];

    const timelineData = sensors.map(sensor => ({
        x: [0, 319], // Duration in seconds
        y: [sensor.name, sensor.name],
        mode: 'lines',
        line: { width: 10 },
        name: `${sensor.name} (${sensor.count} msgs)`,
        hovertemplate: `${sensor.name}<br>Frequency: ${sensor.freq}<br>Messages: ${sensor.count}<extra></extra>`
    }));

    const layout = {
        title: 'Sensor Data Timeline',
        xaxis: { title: 'Time (seconds)' },
        yaxis: { title: 'Sensors' },
        margin: { l: 120, r: 50, t: 50, b: 50 },
        showlegend: true,
        legend: { x: 1, y: 1 }
    };

    Plotly.newPlot('sensor-timeline', timelineData, layout, {responsive: true});
    console.log('Sample sensor timeline loaded');
}

// Utility functions
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    return num.toLocaleString();
}

// ============ SYNCHRONIZED VISUALIZATION FUNCTIONS ============

async function initializeLivePointCloud() {
    // Initialize 3D scene for accumulated point cloud
    const container = document.getElementById('pointcloud-container');
    if (!container) return;
    
    console.log('Initializing accumulated point cloud viewer...');
    
    // Create Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    scene.add(directionalLight);
    
    // Add coordinate axes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Store scene objects globally
    window.pointCloudScene = {
        scene: scene,
        camera: camera,
        renderer: renderer,
        accumulatedPoints: []
    };
    
    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 200;
    controls.minDistance = 5;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    // Load and display ICP-registered point cloud
    await loadRegisteredPointCloud();
    
    console.log('Accumulated point cloud viewer initialized');
}

async function loadRegisteredPointCloud() {
    const dataPath = syncPlayback.dataPath || './static/sync_data_20sec';
    
    try {
        console.log('🛰️ Loading automatically calibrated LiDAR point cloud...');
        
        // Load the automatically calibrated point cloud 
        const response = await fetch(`${dataPath}/simplified_registered_pointcloud.json`);
        const registeredData = await response.json();
        
        console.log(`✅ Loaded automatically calibrated point cloud: ${registeredData.total_points} points`);
        console.log(`📊 Registration method: ${registeredData.registration_method}`);
        console.log(`🔄 LiDAR mount: ${registeredData.transform_applied.rotation_degrees[0].toFixed(0)}° downward-facing (auto-detected)`);
        console.log(`🎯 Calibration method: ${registeredData.metadata.calibration_method}`);
        console.log(`📐 Frames processed: ${registeredData.metadata.frames_processed}`);
        
        const allPoints = registeredData.points.map(point => {
            // Filter out invalid points and ensure proper format
            const x = point[0];
            const y = point[1]; 
            const z = point[2];
            
            if (isFinite(x) && isFinite(y) && isFinite(z) && 
                Math.abs(x) < 500 && Math.abs(y) < 500 && Math.abs(z) < 200) {
                
                return [
                    x,
                    y, 
                    z,
                    point[3] || 0.2, // R
                    point[4] || 0.7, // G  
                    point[5] || 0.3  // B
                ];
            }
            return null;
        }).filter(point => point !== null);
        
        console.log(`🎯 Displaying ${allPoints.length} GPS-registered LiDAR points`);
        
        // Create and display the registered point cloud
        displayRegisteredPointCloud(allPoints, registeredData);
        
    } catch (error) {
        console.error('Failed to load GPS-registered point cloud:', error);
        // Fall back to original method if registered data not available
        console.log('Falling back to individual frame loading...');
        await loadAccumulatedPointCloud();
    }
}

function displayRealPointCloud(points, frameCount, totalFrames) {
    if (!window.pointCloudScene || points.length === 0) return;
    
    console.log(`🎯 Displaying ${points.length} real LiDAR points from Ouster sensor`);
    console.log(`📊 From ${frameCount} frames out of ${totalFrames} total frames`);
    
    const vertices = [];
    const colors = [];
    
    points.forEach(point => {
        vertices.push(point[0], point[1], point[2]);
        colors.push(point[3], point[4], point[5]);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({ 
        size: 0.1, 
        vertexColors: true,
        sizeAttenuation: true
    });
    
    // Remove existing point cloud
    const existingCloud = window.pointCloudScene.getObjectByName('pointcloud');
    if (existingCloud) {
        window.pointCloudScene.remove(existingCloud);
        existingCloud.geometry.dispose();
        existingCloud.material.dispose();
    }
    
    const pointCloud = new THREE.Points(geometry, material);
    pointCloud.name = 'pointcloud';
    window.pointCloudScene.add(pointCloud);
    
    // Store for later use
    window.pointCloudScene.accumulatedPoints = points;
    
    // Add info display
    addRealPointCloudInfo(points.length, frameCount, totalFrames);
}

function addRealPointCloudInfo(pointCount, frameCount, totalFrames) {
    const container = document.getElementById('pointcloud-container');
    if (!container) return;
    
    // Remove existing info
    const existingInfo = container.querySelector('.pointcloud-info');
    if (existingInfo) existingInfo.remove();
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'pointcloud-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.background = 'rgba(0,0,0,0.9)';
    infoDiv.style.color = 'white';
    infoDiv.style.padding = '12px';
    infoDiv.style.borderRadius = '6px';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.zIndex = '1000';
    infoDiv.innerHTML = `
        <strong>🎯 Real LiDAR Data</strong><br>
        <strong>Points:</strong> ${pointCount.toLocaleString()}<br>
        <strong>Frames:</strong> ${frameCount}/${totalFrames}<br>
        <strong>Sensor:</strong> Ouster (512x128)<br>
        <strong>Location:</strong> Saxony, Germany<br>
        <strong>Format:</strong> ROS2 PointCloud2<br>
        <small>🖱️ Mouse: orbit | 🖱️ Scroll: zoom</small>
    `;
    
    container.style.position = 'relative';
    container.appendChild(infoDiv);
}

function displayAccumulatedPointCloud(points, frameCount = 0, totalFrames = 0) {
    if (!window.pointCloudScene || points.length === 0) return;
    
    console.log(`Displaying ${points.length} real LiDAR points from Ouster sensor`);
    
    const vertices = [];
    const colors = [];
    
    points.forEach(point => {
        vertices.push(point[0], point[1], point[2]);
        colors.push(point[3], point[4], point[5]);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({ 
        size: 0.1, 
        vertexColors: true,
        sizeAttenuation: true
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    window.pointCloudScene.scene.add(pointCloud);
    
    // Store for later use
    window.pointCloudScene.accumulatedPoints = points;
    
    // Add info display
    addPointCloudInfo(points.length, frameCount, totalFrames);
}

function displayRegisteredPointCloud(points, registeredData) {
    if (!window.pointCloudScene || points.length === 0) return;
    
    console.log(`Displaying ${points.length} ICP-registered LiDAR points`);
    
    const vertices = [];
    const colors = [];
    
    points.forEach(point => {
        vertices.push(point[0], point[1], point[2]);
        colors.push(point[3], point[4], point[5]);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({ 
        size: 0.15, 
        vertexColors: true,
        sizeAttenuation: true
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    window.pointCloudScene.scene.add(pointCloud);
    
    // Store for later use
    window.pointCloudScene.accumulatedPoints = points;
    
    // Add info display with ICP details
    addRegisteredPointCloudInfo(points.length, registeredData);
}

function addRegisteredPointCloudInfo(pointCount, registeredData) {
    const container = document.getElementById('pointcloud-container');
    if (!container) return;
    
    // Remove existing info
    const existingInfo = container.querySelector('.pointcloud-info');
    if (existingInfo) existingInfo.remove();
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'pointcloud-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.background = 'rgba(0,0,0,0.9)';
    infoDiv.style.color = 'white';
    infoDiv.style.padding = '12px';
    infoDiv.style.borderRadius = '6px';
    infoDiv.style.fontSize = '13px';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.lineHeight = '1.4';
    infoDiv.innerHTML = `
        <strong>🔄 Orientation-Corrected & GPS-Registered</strong><br>
        <span style="color: #4CAF50;">Displayed:</span> ${pointCount.toLocaleString()} points<br>
        <span style="color: #2196F3;">Original:</span> ${registeredData.original_points?.toLocaleString() || 'N/A'} points<br>
        <span style="color: #FF9800;">Mount Fix:</span> ${registeredData.lidar_mount_correction || '45° downward corrected'}<br>
        <span style="color: #9C27B0;">Registration:</span> GPS trajectory alignment<br>
        <span style="color: #E91E63;">Location:</span> Saxony, Germany<br>
        <small style="color: #AAA;">Use mouse to orbit, scroll to zoom</small>
    `;
    
    container.style.position = 'relative';
    container.appendChild(infoDiv);
}

// Fallback function to load individual point cloud frames
async function loadAccumulatedPointCloud() {
    const dataPath = syncPlayback.dataPath || './static/sync_data_20sec';
    
    try {
        // Load pointcloud metadata
        const metadataResponse = await fetch(`${dataPath}/pointcloud_metadata.json`);
        const metadata = await metadataResponse.json();
        
        console.log(`Loading ${metadata.total_frames} point cloud frames (fallback method)...`);
        
        let allPoints = [];
        let frameCount = 0;
        
        // Load each point cloud frame
        for (const frameInfo of metadata.frames) {
            try {
                const response = await fetch(`${dataPath}/pointclouds/${frameInfo.filename}`);
                const frameData = await response.json();
                
                if (frameData.points && frameData.points.length > 0) {
                    frameData.points.forEach(point => {
                        const x = point[0];
                        const y = point[1]; 
                        const z = point[2];
                        
                        if (isFinite(x) && isFinite(y) && isFinite(z) && 
                            Math.abs(x) < 100 && Math.abs(y) < 100 && Math.abs(z) < 50) {
                            
                            const realPoint = [
                                x, y, z,
                                point[3] || 0.2, // R
                                point[4] || 0.7, // G  
                                point[5] || 0.3  // B
                            ];
                            allPoints.push(realPoint);
                        }
                    });
                    
                    frameCount++;
                }
            } catch (error) {
                console.warn(`Failed to load frame ${frameInfo.filename}:`, error);
            }
        }
        
        console.log(`Fallback: Accumulated ${allPoints.length} points from ${frameCount} frames`);
        displayAccumulatedPointCloud(allPoints, frameCount, metadata.total_frames);
        
    } catch (error) {
        console.error('Failed to load point cloud data:', error);
        createSampleAccumulatedPointCloud();
    }
}

function createSampleAccumulatedPointCloud() {
    console.log('Creating sample accumulated point cloud...');
    
    const samplePoints = [];
    
    // Create a sample agricultural scene with multiple "frames"
    for (let frame = 0; frame < 10; frame++) {
        const frameOffset = frame * 5; // Offset each frame
        
        // Ground points
        for (let i = 0; i < 2000; i++) {
            samplePoints.push([
                (Math.random() - 0.5) * 100 + frameOffset,
                -2 + Math.random() * 1,
                (Math.random() - 0.5) * 50,
                0.4, 0.3, 0.2 // Brown ground
            ]);
        }
        
        // Vegetation points
        for (let i = 0; i < 1000; i++) {
            samplePoints.push([
                (Math.random() - 0.5) * 80 + frameOffset,
                Math.random() * 6,
                (Math.random() - 0.5) * 40,
                0.1, 0.8, 0.2 // Green vegetation
            ]);
        }
        
        // Vehicle/equipment points
        for (let i = 0; i < 200; i++) {
            samplePoints.push([
                frameOffset + (Math.random() - 0.5) * 10,
                1 + Math.random() * 3,
                (Math.random() - 0.5) * 8,
                0.8, 0.8, 0.8 // Gray vehicle
            ]);
        }
    }
    
    displayAccumulatedPointCloud(samplePoints);
}

function addPointCloudInfo(pointCount, frameCount = 0, totalFrames = 0) {
    const container = document.getElementById('pointcloud-container');
    if (!container) return;
    
    // Remove existing info
    const existingInfo = container.querySelector('.pointcloud-info');
    if (existingInfo) existingInfo.remove();
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'pointcloud-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.background = 'rgba(0,0,0,0.8)';
    infoDiv.style.color = 'white';
    infoDiv.style.padding = '8px';
    infoDiv.style.borderRadius = '4px';
    infoDiv.style.fontSize = '12px';
    
    const frameInfo = frameCount > 0 ? `<br>Frames: ${frameCount}/${totalFrames}` : '';
    
    infoDiv.innerHTML = `
        <strong>Real LiDAR Point Cloud</strong><br>
        Points: ${pointCount.toLocaleString()}${frameInfo}<br>
        Sensor: Ouster LiDAR<br>
        <span style="color: #4CAF50;">✓ Real rosbag data</span><br>
        <small>Use mouse to orbit, scroll to zoom</small>
    `;
    
    container.style.position = 'relative';
    container.appendChild(infoDiv);
}

// Removed updatePointCloudToTime function

function initializeLiveGPSPlot() {
    const container = document.getElementById('gps-live-plot');
    if (!container || !syncPlayback.gpsData) return;
    
    // Show complete GPS path (not animated)
    const allLatitudes = syncPlayback.gpsData.map(point => point.latitude);
    const allLongitudes = syncPlayback.gpsData.map(point => point.longitude);
    
    const completePath = {
        lat: allLatitudes,
        lon: allLongitudes,
        mode: 'markers+lines',
        type: 'scattermapbox',
        marker: {
            size: 4,
            color: 'blue',
            opacity: 0.7
        },
        line: {
            color: 'blue',
            width: 3
        },
        name: 'Complete Vehicle Path'
    };
    
    // Start and end markers
    const startMarker = {
        lat: [allLatitudes[0]],
        lon: [allLongitudes[0]],
        mode: 'markers',
        type: 'scattermapbox',
        marker: {
            size: 12,
            color: 'green',
            symbol: 'circle'
        },
        name: 'Start Position'
    };
    
    const endMarker = {
        lat: [allLatitudes[allLatitudes.length - 1]],
        lon: [allLongitudes[allLongitudes.length - 1]],
        mode: 'markers',
        type: 'scattermapbox',
        marker: {
            size: 12,
            color: 'red',
            symbol: 'circle'
        },
        name: 'End Position'
    };
    
    // Calculate map center
    const centerLat = allLatitudes.reduce((sum, lat) => sum + lat, 0) / allLatitudes.length;
    const centerLon = allLongitudes.reduce((sum, lon) => sum + lon, 0) / allLongitudes.length;
    
    const layout = {
        title: 'Vehicle Trajectory of video above',
        mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 17
        },
        margin: { r: 20, t: 40, l: 20, b: 20 },
        showlegend: true,
        legend: { x: 0, y: 1 },
        height: 400
    };
    
    Plotly.newPlot('gps-live-plot', [completePath, startMarker, endMarker], layout, {responsive: true});
    console.log(`Complete GPS path displayed with ${syncPlayback.gpsData.length} points`);
}

function updateGPSPlotToTime(timeSeconds) {
    // GPS now shows complete path - no updates needed
    return;
}

// Removed initializeLiveIMUPlot function

// Removed updateIMUPlotToTime function 