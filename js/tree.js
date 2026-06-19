/**
 * Organic SVG Living Tree controller for EcoLoop.
 * Generates an interactive tree that grows canopy leaves based on XP,
 * and blooms based on weekly nudge completion states.
 */

export const tree = {
  /**
   * Renders the tree into the container based on current user state
   * @param {SVGElement} svg - The SVG container element
   * @param {Object} state - The current state object (xp, level, nudges)
   */
  render(svg, state, previewState = null) {
    if (!svg) return;

    // Clear previous dynamic contents (keep static filter defs if any)
    const dynamicGroup = svg.querySelector("#dynamic-tree-content") || svg;
    if (dynamicGroup === svg) {
      // If no group exists, initialize structure
      svg.innerHTML = `
        <defs>
          <filter id="glow-mint" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#8FA89B" flood-opacity="0.5" />
          </filter>
          <filter id="glow-active" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g id="dynamic-tree-content"></g>
      `;
    }

    const container = svg.querySelector("#dynamic-tree-content");
    container.innerHTML = ""; // Clean drawings

    const width = svg.clientWidth || 360;
    const height = svg.clientHeight || 420;

    // Trunk scale parameters check preview overrides
    let finalLevel = state.level;
    let finalXp = state.xp;
    let weekCount = Math.max(1, state.currentWeek || 1);

    if (previewState === "withered") {
      finalLevel = 1;
      finalXp = 0;
      weekCount = 1;
    } else if (previewState === "flourishing") {
      finalLevel = 5;
      finalXp = 500;
      weekCount = 5;
    }

    // Trunk path parameters
    const startX = width / 2;
    const startY = height - 30;
    
    // Scale factor based on user level (tree gets taller/wider as user levels up)
    const levelScale = Math.min(1.4, 0.95 + (finalLevel - 1) * 0.08);
    const trunkHeight = 120 * levelScale;

    // Draw trunk: beautiful organic Bezier curve using Deep Plum color (#3B1E30)
    const cp1x = startX - 15;
    const cp1y = startY - trunkHeight / 2;
    const cp2x = startX + 10;
    const cp2y = startY - trunkHeight;
    const endX = startX - 5;
    const endY = startY - trunkHeight - 20;

    const trunkPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trunkPath.setAttribute("d", `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
    trunkPath.setAttribute("stroke", "#3B1E30");
    trunkPath.setAttribute("stroke-width", "12");
    trunkPath.setAttribute("fill", "none");
    trunkPath.setAttribute("stroke-linecap", "round");
    trunkPath.setAttribute("class", "tree-trunk");
    container.appendChild(trunkPath);

    // Core branch structures (origins relative to trunk end)
    const branches = [
      {
        id: "left",
        d: `M ${endX} ${endY} C ${endX - 30} ${endY - 30}, ${endX - 70} ${endY - 40}, ${endX - 90} ${endY - 80}`,
        endX: endX - 90,
        endY: endY - 80,
        width: 7,
        leafDirection: -135
      },
      {
        id: "center-left",
        d: `M ${endX} ${endY} C ${endX - 10} ${endY - 40}, ${endX - 30} ${endY - 80}, ${endX - 25} ${endY - 120}`,
        endX: endX - 25,
        endY: endY - 120,
        width: 6,
        leafDirection: -95
      },
      {
        id: "center-right",
        d: `M ${endX} ${endY} C ${endX + 15} ${endY - 40}, ${endX + 40} ${endY - 90}, ${endX + 45} ${endY - 130}`,
        endX: endX + 45,
        endY: endY - 130,
        width: 6,
        leafDirection: -85
      },
      {
        id: "right",
        d: `M ${endX} ${endY} C ${endX + 35} ${endY - 20}, ${endX + 75} ${endY - 35}, ${endX + 95} ${endY - 70}`,
        endX: endX + 95,
        endY: endY - 70,
        width: 7,
        leafDirection: -45
      }
    ];

    // Sub-branches (twigs)
    const subBranches = [
      // Left twigs
      { d: `M ${endX - 45} ${endY - 35} C ${endX - 60} ${endY - 60}, ${endX - 85} ${endY - 60}, ${endX - 100} ${endY - 70}`, endX: endX - 100, endY: endY - 70, width: 3.5 },
      // Right twigs
      { d: `M ${endX + 50} ${endY - 26} C ${endX + 70} ${endY - 50}, ${endX + 90} ${endY - 50}, ${endX + 105} ${endY - 55}`, endX: endX + 105, endY: endY - 55, width: 3.5 },
      // Top-left twigs
      { d: `M ${endX - 15} ${endY - 70} C ${endX - 35} ${endY - 95}, ${endX - 60} ${endY - 110}, ${endX - 65} ${endY - 130}`, endX: endX - 65, endY: endY - 130, width: 3 },
      // Top-right twigs
      { d: `M ${endX + 22} ${endY - 60} C ${endX + 35} ${endY - 90}, ${endX + 65} ${endY - 105}, ${endX + 75} ${endY - 120}`, endX: endX + 75, endY: endY - 120, width: 3 }
    ];

    // Render primary branches
    branches.forEach(b => {
      const bPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      bPath.setAttribute("d", b.d);
      bPath.setAttribute("stroke", "#3B1E30");
      bPath.setAttribute("stroke-width", b.width);
      bPath.setAttribute("fill", "none");
      bPath.setAttribute("stroke-linecap", "round");
      bPath.setAttribute("class", "tree-branch");
      container.appendChild(bPath);
    });

    // Render twigs
    subBranches.forEach(sb => {
      const sbPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      sbPath.setAttribute("d", sb.d);
      sbPath.setAttribute("stroke", "#3B1E30");
      sbPath.setAttribute("stroke-width", sb.width);
      sbPath.setAttribute("fill", "none");
      sbPath.setAttribute("stroke-linecap", "round");
      container.appendChild(sbPath);
    });

    // 1. HISTORICAL CANOPY LEAVES (Based on total XP)
    const leafAttachPoints = [
      // Major branch tips
      { x: endX - 90, y: endY - 80, angle: -135 },
      { x: endX - 25, y: endY - 120, angle: -95 },
      { x: endX + 45, y: endY - 130, angle: -85 },
      { x: endX + 95, y: endY - 70, angle: -45 },
      // Twigs
      { x: endX - 100, y: endY - 70, angle: -150 },
      { x: endX + 105, y: endY - 55, angle: -30 },
      { x: endX - 65, y: endY - 130, angle: -110 },
      { x: endX + 75, y: endY - 120, angle: -70 },
      // Mid-branch spots for density
      { x: endX - 50, y: endY - 35, angle: -140 },
      { x: endX + 50, y: endY - 26, angle: -40 },
      { x: endX - 18, y: endY - 80, angle: -100 },
      { x: endX + 26, y: endY - 85, angle: -80 }
    ];

    // Determine how many canopy leaves to render
    let canopyLeafCount = 0;
    if (previewState === "withered") {
      canopyLeafCount = 2; // Barely any leaves
    } else if (previewState === "flourishing") {
      canopyLeafCount = 45; // Lush canopy
    } else {
      const baseCount = 4;
      const xpBonus = Math.floor(finalXp / 15);
      canopyLeafCount = Math.min(45, baseCount + xpBonus);
    }

    // Render canopy leaves
    for (let i = 0; i < canopyLeafCount; i++) {
      const basePoint = leafAttachPoints[i % leafAttachPoints.length];
      const multiplier = Math.floor(i / leafAttachPoints.length);
      const jitterX = (Math.sin(i * 1.7) * 22) * (multiplier * 0.4 + 1);
      const jitterY = (Math.cos(i * 2.3) * 18) * (multiplier * 0.4 + 1);
      
      const x = basePoint.x + jitterX;
      const y = basePoint.y + jitterY;
      const angle = basePoint.angle + (Math.sin(i) * 20);

      // Color scheme based on state
      let colors = ["#8FA89B", "#A4BCAE", "#728F80", "#CBE7D3"];
      if (previewState === "withered") {
        colors = ["#D18B8C", "#B88E5C", "#A89495"]; // Dried terracotta and brown
      } else if (previewState === "flourishing") {
        colors = ["#CBE7D3", "#A3D9B1", "#728F80", "#8FA89B"]; // Bright green/mint
      }
      const color = colors[i % colors.length];

      const leafGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      leafGroup.setAttribute("transform", `translate(${x}, ${y}) rotate(${angle})`);

      const leafPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      leafPath.setAttribute("d", "M 0 0 C 4 -12, 10 -12, 12 -4 C 12 4, 4 4, 0 0");
      leafPath.setAttribute("fill", color);
      leafPath.setAttribute("opacity", previewState === "withered" ? "0.6" : "0.85");
      leafPath.setAttribute("class", "canopy-leaf");
      leafPath.setAttribute("style", `animation-delay: ${i * 30}ms;`);
      leafGroup.appendChild(leafPath);

      container.appendChild(leafGroup);
    }

    // 2. WEEKLY BLOOM PROGRESS (Adds gold blossoms for each completed week!)
    let blossomsCount = 0;
    if (previewState === "withered") {
      blossomsCount = 0;
    } else if (previewState === "flourishing") {
      blossomsCount = 24;
    } else {
      blossomsCount = Math.min(24, (weekCount - 1) * 6);
    }

    const blossomPoints = [
      { x: endX - 100, y: endY - 70, dx: -2, dy: -2 },
      { x: endX + 105, y: endY - 55, dx: 3, dy: -1 },
      { x: endX - 65, y: endY - 130, dx: -1, dy: -3 },
      { x: endX + 75, y: endY - 120, dx: 2, dy: -2 },
      { x: endX - 90, y: endY - 90, dx: -3, dy: 1 },
      { x: endX + 90, y: endY - 80, dx: 3, dy: 2 },
      { x: endX - 45, y: endY - 110, dx: -2, dy: -1 },
      { x: endX + 55, y: endY - 115, dx: 2, dy: -3 },
      { x: endX - 10, y: endY - 135, dx: 1, dy: -2 },
      { x: endX + 15, y: endY - 140, dx: -1, dy: -1 },
      { x: endX - 75, y: endY - 105, dx: -2, dy: -2 },
      { x: endX + 68, y: endY - 95, dx: 2, dy: 1 }
    ];

    for (let j = 0; j < blossomsCount; j++) {
      const pt = blossomPoints[j % blossomPoints.length];
      const jitterX = Math.sin(j * 3.4) * 8 + pt.dx * Math.floor(j / blossomPoints.length);
      const jitterY = Math.cos(j * 1.7) * 8 + pt.dy * Math.floor(j / blossomPoints.length);
      
      const x = pt.x + jitterX;
      const y = pt.y + jitterY;

      const blossomGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      blossomGroup.setAttribute("transform", `translate(${x}, ${y})`);

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", "0");
      dot.setAttribute("cy", "0");
      dot.setAttribute("r", "3.2");
      dot.setAttribute("fill", "#EAD9A4"); // Soft gold/yellow petals
      dot.setAttribute("stroke", "#3B1E30");
      dot.setAttribute("stroke-width", "0.6");
      dot.setAttribute("class", "weekly-blossom-dot");
      blossomGroup.appendChild(dot);
      
      container.appendChild(blossomGroup);
    }

    // 3. STREAK FRUITS (Grows sweet orange/coral berries for active weekly streaks!)
    const streak = state.streak || 0;
    let fruitsCount = 0;
    if (previewState === "withered") {
      fruitsCount = 0;
    } else if (previewState === "flourishing") {
      fruitsCount = 12;
    } else {
      fruitsCount = Math.min(12, streak * 2); // 2 fruits per streak level, max 12
    }

    const fruitPoints = [
      { x: endX - 80, y: endY - 60 },
      { x: endX + 85, y: endY - 50 },
      { x: endX - 55, y: endY - 110 },
      { x: endX + 65, y: endY - 100 },
      { x: endX - 20, y: endY - 100 },
      { x: endX + 25, y: endY - 110 },
      { x: endX - 70, y: endY - 50 },
      { x: endX + 75, y: endY - 40 },
      { x: endX - 35, y: endY - 120 },
      { x: endX + 35, y: endY - 125 },
      { x: endX - 95, y: endY - 65 },
      { x: endX + 95, y: endY - 55 }
    ];

    for (let k = 0; k < fruitsCount; k++) {
      const pt = fruitPoints[k % fruitPoints.length];
      const fruitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      fruitGroup.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `Streak Fruit! Active Streak: ${streak} weeks`;
      fruitGroup.appendChild(title);

      const animGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      animGroup.setAttribute("class", "streak-fruit");

      // A small stem for the fruit
      const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
      stem.setAttribute("d", "M 0 0 Q 2 -5, 0 -7");
      stem.setAttribute("stroke", "#3B1E30");
      stem.setAttribute("stroke-width", "0.8");
      stem.setAttribute("fill", "none");
      animGroup.appendChild(stem);

      // Draw a little round fruit/berry
      const berry = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      berry.setAttribute("cx", "0");
      berry.setAttribute("cy", "0");
      berry.setAttribute("r", "4.5");
      berry.setAttribute("fill", "#FF8A65"); // Beautiful coral orange/rose fruit color
      berry.setAttribute("stroke", "#3B1E30");
      berry.setAttribute("stroke-width", "0.8");
      animGroup.appendChild(berry);
      
      // Add a subtle reflection highlight
      const highlight = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      highlight.setAttribute("cx", "-1.5");
      highlight.setAttribute("cy", "-1.5");
      highlight.setAttribute("r", "1.2");
      highlight.setAttribute("fill", "#FFF");
      highlight.setAttribute("opacity", "0.6");
      animGroup.appendChild(highlight);

      fruitGroup.appendChild(animGroup);
      container.appendChild(fruitGroup);
    }

    // 4. ACTIVE WEEK ACTION BLOOMS (Exactly 3 prominent flowers representing this week's 3 nudges)
    const bloomPositions = [
      { x: endX - 90, y: endY - 80, angle: -135 },
      { x: endX - 5, y: endY - 145, angle: -90 },
      { x: endX + 95, y: endY - 70, angle: -45 }
    ];

    const currentNudges = state.nudges || [];
    
    bloomPositions.forEach((pos, index) => {
      const nudge = currentNudges[index];
      let completed = false;

      if (previewState === "withered") {
        completed = false;
      } else if (previewState === "flourishing") {
        completed = true;
      } else if (nudge) {
        completed = nudge.completed;
      } else {
        return;
      }

      const bloomGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      bloomGroup.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);

      const animGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      animGroup.setAttribute("class", `action-bloom ${completed ? "bloomed" : "withered"}`);
      animGroup.setAttribute("style", `cursor: pointer; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);`);
      animGroup.setAttribute("data-nudge-index", index);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = nudge ? `${nudge.title} (${completed ? "Completed" : "Pending"})` : "Weekly bloom";
      animGroup.appendChild(title);

      if (completed) {
        // Outer pulsing glow
        const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        glow.setAttribute("cx", "0");
        glow.setAttribute("cy", "0");
        glow.setAttribute("r", "16");
        glow.setAttribute("fill", "#CBE7D3");
        glow.setAttribute("opacity", "0.4");
        glow.setAttribute("class", "bloom-glow-pulse");
        animGroup.appendChild(glow);

        // Flower petals
        for (let p = 0; p < 5; p++) {
          const petalAngle = p * 72;
          const petal = document.createElementNS("http://www.w3.org/2000/svg", "path");
          petal.setAttribute("d", "M 0 0 C -4 -10, 4 -10, 0 0");
          petal.setAttribute("transform", `rotate(${petalAngle}) translate(0, -2)`);
          petal.setAttribute("fill", "#CBE7D3");
          petal.setAttribute("stroke", "#8FA89B");
          petal.setAttribute("stroke-width", "0.8");
          animGroup.appendChild(petal);
        }

        // Center pollen core
        const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        center.setAttribute("cx", "0");
        center.setAttribute("cy", "0");
        center.setAttribute("r", "4.5");
        center.setAttribute("fill", "#FDFBF7");
        center.setAttribute("stroke", "#3B1E30");
        center.setAttribute("stroke-width", "1");
        animGroup.appendChild(center);

      } else {
        const stemAngle = pos.angle + 25; // Droop
        const budGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        budGroup.setAttribute("transform", `rotate(${stemAngle})`);

        const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        stem.setAttribute("d", "M 0 0 C 0 5, -5 10, -5 14");
        stem.setAttribute("stroke", "#3B1E30");
        stem.setAttribute("stroke-width", "2");
        stem.setAttribute("fill", "none");
        budGroup.appendChild(stem);

        const bud = document.createElementNS("http://www.w3.org/2000/svg", "path");
        bud.setAttribute("d", "M -5 14 C -9 14, -9 22, -5 25 C -1 22, -1 14, -5 14");
        bud.setAttribute("fill", "#D18B8C"); // Withered terracotta red
        bud.setAttribute("stroke", "#3B1E30");
        bud.setAttribute("stroke-width", "1.2");
        bud.setAttribute("opacity", "0.85");
        budGroup.appendChild(bud);

        animGroup.appendChild(budGroup);
      }

      bloomGroup.appendChild(animGroup);
      container.appendChild(bloomGroup);
    });
  }
};
