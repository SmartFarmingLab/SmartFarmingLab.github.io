# Agricultural Autonomous Driving Dataset

This repository contains the source code for the **Agricultural Autonomous Driving Dataset** website from Smart Farming Lab, Leipzig University.

## Dataset Overview

The dataset contains multi-modal sensor data from agricultural environments, including:

- **6 RGB Cameras** (rear left/mid/right, side left/right, stereo ZED)
- **LiDAR Point Clouds** from Ouster sensor
- **High-precision GPS** positioning with Novatel OEM7
- **IMU measurements** for comprehensive environmental perception
- **Duration**: ~5.3 minutes of synchronized data
- **Total Messages**: 146,410 across all sensors

## Website Features

- **Interactive 3D Point Cloud Viewer** using Three.js
- **GPS Trajectory Visualization** with interactive maps
- **Multi-Camera System Display** with sample images
- **Sensor Timeline** showing data synchronization
- **Responsive Nerfies-style Design** optimized for all devices

## Data Extraction

The website includes sample data extracted from the rosbag files:
- Sample images from all camera viewpoints
- GPS trajectory data for mapping
- Point cloud samples for 3D visualization
- Sensor timing information

## Development

### Prerequisites
- Python 3.7+
- Required packages: `numpy`, `opencv-python`, `matplotlib`, `folium`, `mcap`

### Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Extract sample data: `python extract_rosbag_data.py`
4. Open `index.html` in a web browser

### Deployment
This website is configured for GitHub Pages deployment. Push to the `main` branch to automatically deploy.

## Citation

If you use this dataset in your research, please cite:

```bibtex
@dataset{smartfarming2025agricultural,
  title={Agricultural Autonomous Driving Dataset},
  author={Smart Farming Lab},
  institution={Leipzig University},
  year={2025},
}
```

## License

This website is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

Website template adapted from [Nerfies](https://github.com/nerfies/nerfies.github.io).

## Contact

Smart Farming Lab  
Leipzig University  
Germany

---

*Showcasing the future of agricultural robotics and autonomous farming systems.* 