/**
 * Observatory wireframe globe — lat/long graticule + subtle icosphere fill,
 * matching horizon-observatory.html Three.js setup (r128-style).
 *
 * Replaces the textured photoreal Globe for the parchment instrument aesthetic.
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

const GLOBE_CORE_RADIUS = 0.7;
const LINE_RADIUS = 0.72;
const ROTATION_SPEED = (2 * Math.PI) / 48; // one rev / 48s when live

export class WireframeGlobe {
  public readonly group: Group;

  private latLongLines: Group;
  private coreMesh: Mesh;
  private cumulativeRotation = 0;

  constructor() {
    this.group = new Group();
    this.latLongLines = new Group();

    const geoCore = new IcosahedronGeometry(GLOBE_CORE_RADIUS, 2);
    const matCore = new MeshBasicMaterial({
      color: new Color(0xf2ece0),
      transparent: true,
      opacity: 0.55,
    });
    this.coreMesh = new Mesh(geoCore, matCore);
    this.group.add(this.coreMesh);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const curve = new EllipseCurve(0, 0, LINE_RADIUS, LINE_RADIUS, 0, Math.PI * 2, false, 0);
      const pts2 = curve.getPoints(48);
      const pts = pts2.map((p) => new Vector3(p.x, p.y, 0));
      const geo = new BufferGeometry().setFromPoints(pts);
      const mat = new LineBasicMaterial({
        color: 0x141414,
        transparent: true,
        opacity: 0.28,
      });
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
      const pts = pts2.map((p) => new Vector3(p.x, y, p.y));
      const geo = new BufferGeometry().setFromPoints(pts);
      const opacity = i === 4 ? 0.45 : 0.18;
      const mat = new LineBasicMaterial({
        color: 0x141414,
        transparent: true,
        opacity,
      });
      this.latLongLines.add(new Line(geo, mat));
    }

    this.group.add(this.latLongLines);

    const axisGeo = new BufferGeometry().setFromPoints([
      new Vector3(0, -0.85, 0),
      new Vector3(0, 0.85, 0),
    ]);
    const axisMat = new LineBasicMaterial({
      color: 0xd4502c,
      transparent: true,
      opacity: 0.4,
    });
    this.group.add(new Line(axisGeo, axisMat));
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
    this.group.traverse((obj) => {
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
