import React from "react";
import { Card, CardContent } from '@/components/ui/card';

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-96">
      <CardContent className="pt-8 pb-8">
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: '80px',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              width: '10px',
              backgroundColor: '#000',
              animation: 'slideRight 0.5s ease-in-out infinite'
            }}
          ></div>
        </div>
        <style>
          {`
            @keyframes slideRight {
              0% { 
                left: 4px;
                opacity: 1;
              }
              70% {
                opacity: 1;
              }
              100% { 
                left: calc(100% - 24px);
                opacity: 0.1;
              }
            }
          `}
        </style>
      </CardContent>
    </Card>
  </div>
);

export default Spinner;