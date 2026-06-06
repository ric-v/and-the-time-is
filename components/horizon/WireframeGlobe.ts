/**
 * Observatory wireframe globe — lat/long graticule + subtle icosphere fill.
 * Orrery aesthetic: brass instrument lines on parchment / night panel.
 */

import {
  Group,
  Mesh,
  Line,
  IcosahedronGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  LineBasicMaterial,
  EllipseCurve,
  Vector3,
  Color,
} from '../../utils/three-imports';
import type { Object3D } from 'three';
import type { ThemeMode } from '../../store/settingsSlice';

const GLOBE_CORE_RADIUS = 0.7;
const LINE_RADIUS = 0.72;
const ROTATION_SPEED = (2 * Math.PI) / 48;

const BRASS_LIGHT = 0x9c7a3a;
const BRASS_DARK = 0xcaa55d;
const CORE_LIGHT = 0xf6f0e3;
const CORE_DARK = 0x141b2e;
const TERRA_AXIS = 0xc8502d;

export class WireframeGlobe {
  public readonly group: Group;

  private latLongLines: Group;
  private coreMesh: Mesh;
  private lineMaterials: LineBasicMaterial[] = [];
  private axisMaterial: LineBasicMaterial | null = null;
  private cumulativeRotation = 0;

  constructor() {
    this.group = new Group();
    this.latLongLines = new Group();

    const geoCore = new IcosahedronGeometry(GLOBE_CORE_RADIUS, 2);
    const matCore = new MeshBasicMaterial({
      color: new Color(CORE_LIGHT),
      transparent: true,
      opacity: 0.55,
    });
    this.coreMesh = new Mesh(geoCore, matCore);
    this.group.add(this.coreMesh);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const curve = new EllipseCurve(0, 0, LINE_RADIUS, LINE_RADIUS, 0, Math.PI * 2, false, 0);
      const pts2 = curve.getPoints(48);
      const pts = pts2.map((p: { x: number; y: number }) => new Vector3(p.x, p.y, 0));
      const geo = new BufferGeometry().setFromPoints(pts);
      const mat = new LineBasicMaterial({
        color: new Color(BRASS_LIGHT),
        transparent: true,
        opacity: 0.55,
      });
      this.lineMaterials.push(mat);
      const line = new Line(geo, mat);
      line.rotation.y = angle;
      this.latLongLines.add(line);
    }

    for (let i = 1; i <= 7; i++) {
      const lat = (i / 8 - 0.5) * Math.PI;
      const r = Math.cos(lat) * LINE_RADIUS;
      const y = Math.sin(lat) * LINE_RADIUS;
      const curve = new EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
      const pts2 = curve.getPoints(48);
      const pts = pts2.map((p: { x: number; y: number }) => new Vector3(p.x, y, p.y));
      const geo = new BufferGeometry().setFromPoints(pts);
      const opacity = i === 4 ? 0.65 : 0.35;
      const mat = new LineBasicMaterial({
        color: new Color(BRASS_LIGHT),
        transparent: true,
        opacity,
      });
      this.lineMaterials.push(mat);
      this.latLongLines.add(new Line(geo, mat));
    }

    this.group.add(this.latLongLines);

    const axisGeo = new BufferGeometry().setFromPoints([
      new Vector3(0, -0.85, 0),
      new Vector3(0, 0.85, 0),
    ]);
    const axisMat = new LineBasicMaterial({
      color: new Color(TERRA_AXIS),
      transparent: true,
      opacity: 0.45,
    });
    this.axisMaterial = axisMat;
    this.group.add(new Line(axisGeo, axisMat));
    this.setTheme('dark');
  }

  public setTheme(themeMode: ThemeMode): void {
    const isDark = themeMode === 'dark';
    const brass = isDark ? BRASS_DARK : BRASS_LIGHT;
    const coreMaterial = this.coreMesh.material as MeshBasicMaterial;
    coreMaterial.color.set(isDark ? CORE_DARK : CORE_LIGHT);
    coreMaterial.opacity = isDark ? 0.7 : 0.55;

    for (const lineMaterial of this.lineMaterials) {
      lineMaterial.color.set(brass);
    }

    if (this.axisMaterial) {
      this.axisMaterial.color.set(TERRA_AXIS);
      this.axisMaterial.opacity = isDark ? 0.55 : 0.45;
    }
  }

  public update(
    displayedTime: Date,
    deltaTime: number,
    scrubOffset: number,
    liveSpinEnabled: boolean,
  ): void {
    if (scrubOffset === 0 && liveSpinEnabled) {
      this.cumulativeRotation += ROTATION_SPEED * deltaTime;
      this.cumulativeRotation %= Math.PI * 2;
    } else if (scrubOffset === 0 && !liveSpinEnabled) {
      this.latLongLines.rotation.y = this.cumulativeRotation;
      this.coreMesh.rotation.y = this.cumulativeRotation;
      return;
    } else {
      const hours = displayedTime.getUTCHours();
      const minutes = displayedTime.getUTCMinutes();
      const seconds = displayedTime.getUTCSeconds();
      const fractionOfDay = (hours * 3600 + minutes * 60 + seconds) / 86400;
      this.cumulativeRotation = fractionOfDay * Math.PI * 2;
    }
    this.latLongLines.rotation.y = this.cumulativeRotation;
    this.coreMesh.rotation.y = this.cumulativeRotation;
  }

  public dispose(): void {
    this.group.traverse((obj: Object3D) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        (obj.material as MeshBasicMaterial).dispose();
      }
      if (obj instanceof Line) {
        obj.geometry.dispose();
        (obj.material as LineBasicMaterial).dispose();
      }
    });
  }
}
