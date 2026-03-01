'use client';
import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TutorialGuideProps {
  run: boolean;
  setRun: (run: boolean) => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function TutorialGuide({ run, setRun }: TutorialGuideProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMounted(true);
    const hasSeenTutorial = localStorage.getItem('pokelab-tutorial-seen');
    if (!hasSeenTutorial) {
      setTimeout(() => setRun(true), 1200);
    }
  }, [setRun]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('pokelab-tutorial-seen', 'true');
    }
  };

  // En mobile los steps que apuntan al sidebar/grid necesitan placements distintos
  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="space-y-2">
          <h2 className="text-lg font-black text-pokeball-red uppercase italic">¡Bienvenido a Pokelab!</h2>
          <p className="text-sm font-semibold">El motor táctico competitivo más avanzado.</p>
          <p className="text-xs text-slate-400">Tour rápido para dominar todas las herramientas. ¡No tardará ni un minuto!</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '.step-modo-generacion',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-sky-400">Modo de Generación</p>
          <p className="text-sm">"Con Líder" construye el equipo alrededor de un Pokémon. "Desde Cero" deja que la IA arme todo.</p>
        </div>
      ),
      // En mobile el sidebar está fixed a la izquierda — mostramos el tooltip abajo
      placement: isMobile ? 'bottom' : 'right',
      disableBeacon: true,
    },
    {
      target: '.step-grid > div:first-child',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-pokeball-red">Slot del Líder</p>
          <p className="text-sm">Busca aquí al Pokémon estrella sobre el cual girará toda tu estrategia.</p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'right',
      disableBeacon: true,
    },
    {
      target: '.step-grid',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-emerald-400">El Escuadrón</p>
          <p className="text-sm">Rellena los slots manualmente o déjalos vacíos para que la IA complete el equipo.</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.step-magia',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-pokeball-red">Motor de Inferencia</p>
          <p className="text-sm">La IA calcula sinergias y completa los huecos con builds óptimas al instante.</p>
        </div>
      ),
      placement: isMobile ? 'top' : 'top',
      disableBeacon: true,
    },
    {
      target: '.step-reviewer',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-amber-400">El Reviewer</p>
          <p className="text-sm">¿Armaste un equipo propio? La IA actúa como Juez Mundial y califica objetos y sinergias.</p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'bottom',
      disableBeacon: true,
    },
    {
      target: '.step-matriz',
      content: (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase text-violet-400">Matriz de Batalla</p>
          <p className="text-sm">Tabla dinámica con debilidades y resistencias de tu equipo. ¡Listo para el competitivo!</p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ];

  if (!isMounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={isMobile}   // evita saltos bruscos en mobile
      spotlightPadding={isMobile ? 6 : 10}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#dc2626',
          backgroundColor: '#0f172a',
          textColor: '#f1f5f9',
          arrowColor: '#0f172a',
          overlayColor: 'rgba(0,0,0,0.75)',
          zIndex: 99999,
          // Ancho máximo del tooltip: más estrecho en mobile
          width: isMobile ? 280 : 380,
        },
        tooltip: {
          borderRadius: 16,
          padding: isMobile ? '16px' : '20px',
          border: '1px solid rgba(220,38,38,0.2)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        },
        tooltipContainer: {
          textAlign: 'left',
          lineHeight: 1.5,
        },
        tooltipTitle: {
          fontSize: isMobile ? 13 : 14,
          fontWeight: 900,
        },
        tooltipContent: {
          fontSize: isMobile ? 13 : 14,
          padding: '8px 0 0',
          color: '#cbd5e1',
        },
        tooltipFooter: {
          marginTop: isMobile ? 14 : 18,
          gap: 8,
        },
        // Botón Siguiente — más alto en mobile para ser pulsable
        buttonNext: {
          backgroundColor: '#dc2626',
          borderRadius: 10,
          fontWeight: 900,
          textTransform: 'uppercase' as const,
          fontSize: isMobile ? 12 : 11,
          padding: isMobile ? '12px 20px' : '10px 16px',
          letterSpacing: '0.08em',
          border: '1px solid rgba(220,38,38,0.4)',
          minHeight: isMobile ? 44 : undefined,
        },
        buttonBack: {
          color: '#94a3b8',
          fontWeight: 700,
          fontSize: isMobile ? 13 : 12,
          minHeight: isMobile ? 44 : undefined,
        },
        buttonSkip: {
          color: '#ef4444',
          fontWeight: 700,
          fontSize: isMobile ? 13 : 12,
          minHeight: isMobile ? 44 : undefined,
        },
        // Indicador de progreso
        beacon: {
          inner: '#dc2626',
          outer: 'rgba(220,38,38,0.3)',
        } as any,
      }}
      locale={{
        back: '← Atrás',
        close: 'Cerrar',
        last: '¡Empezar!',
        next: 'Siguiente →',
        skip: 'Saltar tour',
      }}
    />
  );
}