import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './BookLanding.css';

const getContrastColor = (hexcolor) => {
  // Convert hex to RGB
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on background luminance
  return luminance > 0.5 ? '#1a0f0a' : '#F5E6D3';
};

const BookLanding = ({ onFileSelect }) => {
  const containerRef = useRef();
  const bookRef = useRef();
  const pagesRef = useRef();
  const coverRef = useRef();
  const [bgColor, setBgColor] = useState('#F5E6D3');
  const textColor = getContrastColor(bgColor);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create book parts
    const createBook = () => {
      const book = new THREE.Group();

      // Cover - dark brown color
      const coverGeometry = new THREE.BoxGeometry(5, 7, 0.2);
      const coverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3d2419,
        metalness: 0.3,
        roughness: 0.7,
        reflectivity: 0.5,
      });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      // Move geometry to make edge the pivot point
      coverGeometry.translate(2.5, 0, 0);
      coverRef.current = cover;

      // Pages - very light brown
      const pagesGroup = new THREE.Group();
      const pageCount = 10;
      const pageWidth = 4.8;
      const pageHeight = 6.8;
      const pageDepth = 0.01;

      for (let i = 0; i < pageCount; i++) {
        const pageGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, pageDepth);
        // Move geometry to make edge the pivot point
        pageGeometry.translate(pageWidth / 2, 0, 0);
        const pageMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xf5e6d3,
          metalness: 0.1,
          roughness: 0.4,
          transparent: true,
          opacity: 0.95,
        });
        const page = new THREE.Mesh(pageGeometry, pageMaterial);
        page.position.z = i * 0.01; // Slight offset for each page
        pagesGroup.add(page);
      }

      pagesRef.current = pagesGroup;
      book.add(pagesGroup);
      book.add(cover);
      return book;
    };

    const book = createBook();
    scene.add(book);
    bookRef.current = book;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x0066ff, 1, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff0066, 1, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    camera.position.z = 15;

    // Animation sequence
    const animateBook = () => {
      const timeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 1,
      });

      // Open cover
      timeline.to(coverRef.current.rotation, {
        y: -Math.PI * 0.8,
        duration: 2,
        ease: "power2.inOut"
      });

      // Flip pages
      const pages = pagesRef.current.children;
      pages.forEach((page, index) => {
        timeline.to(page.rotation, {
          y: -Math.PI * 0.8,
          duration: 0.5,
          ease: "power1.inOut"
        }, `>-${0.4}`);
      });

      // Close pages
      [...pages].reverse().forEach((page, index) => {
        timeline.to(page.rotation, {
          y: 0,
          duration: 0.5,
          ease: "power1.inOut"
        }, `>-${0.4}`);
      });

      // Close cover
      timeline.to(coverRef.current.rotation, {
        y: 0,
        duration: 2,
        ease: "power2.inOut"
      });
    };

    animateBook();

    // Basic floating animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Gentle floating motion
      book.position.y = Math.sin(time) * 0.2;

      // Dynamic lighting
      pointLight1.position.x = Math.sin(time) * 5;
      pointLight1.position.y = Math.cos(time) * 5;
      pointLight2.position.x = -Math.sin(time * 0.5) * 5;
      pointLight2.position.y = -Math.cos(time * 0.5) * 5;

      renderer.render(scene, camera);
    };

    animate();

    // Mouse interaction
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const mouseX = (clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(clientY / window.innerHeight) * 2 + 1;

      gsap.to(book.rotation, {
        x: mouseY * 0.1,
        z: mouseX * 0.1,
        duration: 2,
        ease: "power2.out"
      });
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="landing-container" style={{ background: bgColor }}>
      <div ref={containerRef} className="book-container" />
      <div className="content-overlay">
        <h1 style={{ color: textColor }}>Pustak.AI</h1>
        <p style={{ color: textColor }}>Your intelligent reading companion</p>
        <label 
          className="file-input-label"
          style={{
            background: `${textColor}22`,
            borderColor: textColor,
            color: textColor
          }}
        >
          <input
            type="file"
            accept=".epub"
            onChange={(e) => onFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <span>Open Book</span>
        </label>
      </div>
    </div>
  );
};

export default BookLanding; 