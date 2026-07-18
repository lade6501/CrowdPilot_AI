import React from "react";

interface CrowdLayerProps {
  isWhistle: boolean;
  isFire: boolean;
  isStorm: boolean;
}

export const CrowdLayer: React.FC<CrowdLayerProps> = ({
  isWhistle,
  isFire,
  isStorm,
}) => {
  if (isWhistle) {
    return (
      <g>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5s" repeatCount="indefinite" path="M 400 210 L 400 70" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5s" begin="1.25s" repeatCount="indefinite" path="M 400 210 L 400 70" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5s" begin="2.5s" repeatCount="indefinite" path="M 400 210 L 400 70" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5s" begin="3.75s" repeatCount="indefinite" path="M 400 210 L 400 70" />
        </circle>

        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.8s" repeatCount="indefinite" path="M 400 210 L 700 210" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.8s" begin="1.2s" repeatCount="indefinite" path="M 400 210 L 700 210" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.8s" begin="2.4s" repeatCount="indefinite" path="M 400 210 L 700 210" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.8s" begin="3.6s" repeatCount="indefinite" path="M 400 210 L 700 210" />
        </circle>

        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5.2s" repeatCount="indefinite" path="M 400 210 L 400 350" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5.2s" begin="1.3s" repeatCount="indefinite" path="M 400 210 L 400 350" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5.2s" begin="2.6s" repeatCount="indefinite" path="M 400 210 L 400 350" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="5.2s" begin="3.9s" repeatCount="indefinite" path="M 400 210 L 400 350" />
        </circle>

        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.5s" repeatCount="indefinite" path="M 400 210 L 100 210" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.5s" begin="1.5s" repeatCount="indefinite" path="M 400 210 L 100 210" />
        </circle>
        <circle r="1.2" fill="#10b981">
          <animateMotion dur="4.5s" begin="3s" repeatCount="indefinite" path="M 400 210 L 100 210" />
        </circle>
      </g>
    );
  }

  if (isFire) {
    return (
      <g>
        <circle r="1.2" fill="#ef4444">
          <animateMotion dur="5s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" />
        </circle>
        <circle r="1.2" fill="#ef4444">
          <animateMotion dur="5s" begin="1.66s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" />
        </circle>
        <circle r="1.2" fill="#ef4444">
          <animateMotion dur="5s" begin="3.33s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" />
        </circle>
        <circle r="1.2" fill="#ef4444">
          <animateMotion dur="5.8s" repeatCount="indefinite" path="M 700 210 Q 400 120 100 210" />
        </circle>
        <circle r="1.2" fill="#ef4444">
          <animateMotion dur="5.8s" begin="2.9s" repeatCount="indefinite" path="M 700 210 Q 400 120 100 210" />
        </circle>
      </g>
    );
  }

  if (isStorm) {
    return (
      <g>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="4s" repeatCount="indefinite" path="M 400 70 L 400 145" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="4s" begin="1.33s" repeatCount="indefinite" path="M 400 70 L 400 145" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="4s" begin="2.66s" repeatCount="indefinite" path="M 400 70 L 400 145" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="3.8s" repeatCount="indefinite" path="M 700 210 L 510 210" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="3.8s" begin="1.9s" repeatCount="indefinite" path="M 700 210 L 510 210" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="4.2s" repeatCount="indefinite" path="M 400 350 L 400 275" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="4.2s" begin="2.1s" repeatCount="indefinite" path="M 400 350 L 400 275" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M 100 210 L 290 210" />
        </circle>
        <circle r="1.2" fill="#3b82f6">
          <animateMotion dur="3.5s" begin="1.75s" repeatCount="indefinite" path="M 100 210 L 290 210" />
        </circle>
      </g>
    );
  }

  return (
    <g>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.5s" repeatCount="indefinite" path="M 400 70 L 400 145" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.5s" begin="1.37s" repeatCount="indefinite" path="M 400 70 L 400 145" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.5s" begin="2.75s" repeatCount="indefinite" path="M 400 70 L 400 145" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.5s" begin="4.12s" repeatCount="indefinite" path="M 400 70 L 400 145" />
      </circle>

      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.2s" repeatCount="indefinite" path="M 700 210 L 510 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.2s" begin="1.3s" repeatCount="indefinite" path="M 700 210 L 510 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.2s" begin="2.6s" repeatCount="indefinite" path="M 700 210 L 510 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.2s" begin="3.9s" repeatCount="indefinite" path="M 700 210 L 510 210" />
      </circle>

      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.8s" repeatCount="indefinite" path="M 400 350 L 400 275" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.8s" begin="1.45s" repeatCount="indefinite" path="M 400 350 L 400 275" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.8s" begin="2.9s" repeatCount="indefinite" path="M 400 350 L 400 275" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="5.8s" begin="4.35s" repeatCount="indefinite" path="M 400 350 L 400 275" />
      </circle>

      <circle r="1.2" fill="#10b981">
        <animateMotion dur="4.9s" repeatCount="indefinite" path="M 100 210 L 290 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="4.9s" begin="1.22s" repeatCount="indefinite" path="M 100 210 L 290 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="4.9s" begin="2.44s" repeatCount="indefinite" path="M 100 210 L 290 210" />
      </circle>
      <circle r="1.2" fill="#10b981">
        <animateMotion dur="4.9s" begin="3.66s" repeatCount="indefinite" path="M 100 210 L 290 210" />
      </circle>
    </g>
  );
};
