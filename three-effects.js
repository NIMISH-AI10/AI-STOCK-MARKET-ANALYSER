/* 3D visual layer only — no API, AI, stock-data, or app logic changes. */
(function () {
    const canvas = document.getElementById('ai3dCanvas');
    if (!canvas || !window.THREE) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 8.4);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const group = new THREE.Group();
    scene.add(group);

    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.15, 3),
        new THREE.MeshBasicMaterial({ color: 0x58cfff, wireframe: true, transparent: true, opacity: 0.42 })
    );
    group.add(core);

    const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.78, 2),
        new THREE.MeshBasicMaterial({ color: 0x477dff, wireframe: true, transparent: true, opacity: 0.34 })
    );
    group.add(inner);

    const points = [];
    const count = 1150;
    for (let i = 0; i < count; i++) {
        const radius = 1.45 + Math.random() * 0.95;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        points.push(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const particles = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color: 0x65dcff, size: 0.022, transparent: true, opacity: 0.8 })
    );
    group.add(particles);

    const orbitGroup = new THREE.Group();
    group.add(orbitGroup);
    [1.65, 2.05, 2.45].forEach((radius, index) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.008, 8, 180),
            new THREE.MeshBasicMaterial({ color: index === 1 ? 0x5b9cff : 0x54d6ff, transparent: true, opacity: 0.32 })
        );
        ring.rotation.x = index === 1 ? 1.15 : 0.72 + index * 0.35;
        ring.rotation.y = index * 0.65;
        orbitGroup.add(ring);
    });

    const satellites = new THREE.Group();
    group.add(satellites);
    for (let i = 0; i < 8; i++) {
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.045 + Math.random() * 0.025, 10, 10),
            new THREE.MeshBasicMaterial({ color: i % 2 ? 0x54d6ff : 0x72a7ff })
        );
        dot.userData.angle = (Math.PI * 2 / 8) * i;
        dot.userData.radius = 2.0 + (i % 3) * 0.18;
        dot.userData.speed = 0.25 + (i % 3) * 0.07;
        dot.userData.y = (i - 3.5) * 0.12;
        satellites.add(dot);
    }

    const mouse = { x: 0, y: 0 };
    let targetX = 0, targetY = 0;
    window.addEventListener('pointermove', (event) => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 0.7;
        targetY = (event.clientY / window.innerHeight - 0.5) * 0.35;
    }, { passive: true });

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    const clock = new THREE.Clock();
    function animate() {
        const t = clock.getElapsedTime();
        mouse.x += (targetX - mouse.x) * 0.035;
        mouse.y += (targetY - mouse.y) * 0.035;

        if (!reduceMotion) {
            group.rotation.y += 0.0025;
            core.rotation.x = t * 0.10;
            core.rotation.y = t * 0.17;
            inner.rotation.x = -t * 0.14;
            inner.rotation.z = t * 0.08;
            particles.rotation.y = -t * 0.018;
            orbitGroup.rotation.z = t * 0.035;
            satellites.children.forEach((dot) => {
                const a = dot.userData.angle + t * dot.userData.speed;
                const r = dot.userData.radius;
                dot.position.set(Math.cos(a) * r, dot.userData.y + Math.sin(a * 1.7) * 0.15, Math.sin(a) * r);
            });
        }

        group.rotation.x += ((-mouse.y * 0.18) - group.rotation.x) * 0.025;
        group.rotation.y += ((mouse.x * 0.25) - (group.rotation.y - (reduceMotion ? 0 : t * 0.0025))) * 0.02;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
})();
/* =========================================================
   FULL PAGE 3D BACKGROUND
   ========================================================= */

(function init3DBackground() {

    const canvas =
        document.getElementById("background3D");

    if (!canvas || !window.THREE) return;

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    /* -------------------------------------------------------
       SCENE
       ------------------------------------------------------- */

    const scene =
        new THREE.Scene();


    /* -------------------------------------------------------
       CAMERA
       ------------------------------------------------------- */

    const camera =
        new THREE.PerspectiveCamera(
            60,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1000
        );

    camera.position.z = 18;


    /* -------------------------------------------------------
       RENDERER
       ------------------------------------------------------- */

    const renderer =
        new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    /* -------------------------------------------------------
       PARTICLES
       ------------------------------------------------------- */

    const particleCount = 1800;

    const positions = [];

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        positions.push(
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 28,
            (Math.random() - 0.5) * 35
        );

    }


    const particleGeometry =
        new THREE.BufferGeometry();

    particleGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );


    const particleMaterial =
        new THREE.PointsMaterial({

            color: 0x249cff,

            size: 0.035,

            transparent: true,

            opacity: 0.65,

            depthWrite: false

        });


    const particles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );

    scene.add(particles);


    /* -------------------------------------------------------
       FLOATING HOLOGRAPHIC SPHERES
       ------------------------------------------------------- */

    const spheres =
        new THREE.Group();

    scene.add(spheres);


    for (let i = 0; i < 12; i++) {

        const geometry =
            new THREE.IcosahedronGeometry(
                0.18 + Math.random() * 0.22,
                1
            );


        const material =
            new THREE.MeshBasicMaterial({

                color:
                    i % 2
                        ? 0x1b8cff
                        : 0x42d9ff,

                wireframe: true,

                transparent: true,

                opacity: 0.35

            });


        const sphere =
            new THREE.Mesh(
                geometry,
                material
            );


        sphere.position.set(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 20
        );


        sphere.userData.speed =
            0.001 +
            Math.random() * 0.003;


        spheres.add(sphere);

    }


    /* -------------------------------------------------------
       LARGE BACKGROUND RINGS
       ------------------------------------------------------- */

    const rings =
        new THREE.Group();

    scene.add(rings);


    for (let i = 0; i < 5; i++) {

        const ring =
            new THREE.Mesh(

                new THREE.TorusGeometry(
                    5 + i * 2.2,
                    0.012,
                    8,
                    160
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        i % 2
                            ? 0x168bff
                            : 0x28d5ff,

                    transparent: true,

                    opacity: 0.10

                })

            );


        ring.position.set(
            (i - 2) * 5,
            2,
            -12 - i * 2
        );


        ring.rotation.x =
            Math.PI / 2;


        rings.add(ring);

    }


    /* -------------------------------------------------------
       MOUSE PARALLAX
       ------------------------------------------------------- */

    let mouseX = 0;
    let mouseY = 0;

    let targetX = 0;
    let targetY = 0;


    window.addEventListener(
        "pointermove",
        function(event) {

            targetX =
                (event.clientX /
                    window.innerWidth -
                    0.5) * 0.7;

            targetY =
                (event.clientY /
                    window.innerHeight -
                    0.5) * 0.4;

        },
        { passive: true }
    );


    /* -------------------------------------------------------
       RESIZE
       ------------------------------------------------------- */

    window.addEventListener(
        "resize",
        function() {

            camera.aspect =
                window.innerWidth /
                window.innerHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );

        }
    );


    /* -------------------------------------------------------
       ANIMATION
       ------------------------------------------------------- */

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );


        const time =
            clock.getElapsedTime();


        if (!reduceMotion) {

            particles.rotation.y =
                time * 0.008;

            particles.rotation.x =
                Math.sin(time * 0.08) *
                0.025;


            spheres.children.forEach(
                function(sphere, index) {

                    sphere.rotation.x +=
                        sphere.userData.speed;

                    sphere.rotation.y +=
                        sphere.userData.speed * 1.5;


                    sphere.position.y +=
                        Math.sin(
                            time * 0.25 +
                            index
                        ) * 0.0015;

                }
            );


            rings.rotation.z =
                time * 0.008;

        }


        /* Smooth mouse movement */

        mouseX +=
            (targetX - mouseX) *
            0.025;

        mouseY +=
            (targetY - mouseY) *
            0.025;


        scene.rotation.y =
            mouseX * 0.08;

        scene.rotation.x =
            mouseY * 0.04;


        renderer.render(
            scene,
            camera
        );

    }


    animate();

})();
