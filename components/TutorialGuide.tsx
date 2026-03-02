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

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-pokeball-red uppercase italic">¡Bienvenido a Pokelab!</h2>
          <p className="text-sm font-medium text-foreground">El motor táctico competitivo más avanzado.</p>
          <p className="text-xs text-muted-foreground">Tour rápido para dominar todas las herramientas. ¡No tardará ni un minuto!</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      // En móvil el sidebar está oculto, así que apuntamos a la barra superior (header)
      target: isMobile ? 'header' : '.step-modo-generacion',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Modo de Generación</p>
          <p className="text-xs sm:text-sm text-foreground/90">
            {isMobile 
              ? 'Abre el menú (☰) arriba a la izquierda para elegir si quieres jugar "Con Líder" o "Desde Cero".' 
              : '"Con Líder" construye el equipo alrededor de un Pokémon. "Desde Cero" deja que la IA arme todo.'}
          </p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'right',
      disableBeacon: true,
    },
    {
      target: '.step-grid > div:first-child',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-pokeball-red">Slot del Líder</p>
          <p className="text-xs sm:text-sm text-foreground/90">Busca aquí al Pokémon estrella sobre el cual girará toda tu estrategia.</p>
        </div>
      ),
      // Center en móvil previene que el globo se salga por los bordes de la carta
      placement: isMobile ? 'center' : 'right-start',
      disableBeacon: true,
    },
    {
      // SOLUCIÓN AL PASO 4: Apuntamos SOLO a la segunda carta, no a toda la cuadrícula gigante
      target: '.step-grid > div:nth-child(2)',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">El Escuadrón</p>
          <p className="text-xs sm:text-sm text-foreground/90">Rellena los demás slots manualmente o déjalos vacíos para que la IA complete el equipo.</p>
        </div>
      ),
      placement: isMobile ? 'center' : 'right-start',
      disableBeacon: true,
    },
    {
      target: isMobile ? 'header' : '.step-magia',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-pokeball-red">Motor de Inferencia</p>
          <p className="text-xs sm:text-sm text-foreground/90">
            {isMobile 
              ? 'El botón mágico de "Generar" aparecerá aquí arriba cuando estés listo.' 
              : 'La IA calcula sinergias y completa los huecos con builds óptimas al instante.'}
          </p>
        </div>
      ),
      placement: isMobile ? 'bottom' : 'top',
      disableBeacon: true,
    },
    {
      target: isMobile ? 'header' : '.step-reviewer',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">El Reviewer</p>
          <p className="text-xs sm:text-sm text-foreground/90">
            {isMobile 
              ? 'En el menú encontrarás el Reviewer, donde la IA evaluará tus equipos sin piedad.' 
              : '¿Armaste un equipo propio? Ve aquí para que la IA actúe como Juez Mundial y lo califique.'}
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.step-matriz',
      content: (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Matriz de Batalla</p>
          <p className="text-xs sm:text-sm text-foreground/90">Tabla dinámica con debilidades y resistencias de tu equipo. ¡Listo para competir!</p>
        </div>
      ),
      // Center asegura que el cuadro siempre esté visible en la pantalla
      placement: isMobile ? 'center' : 'top',
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
      // OFFSET Y SCROLL VITALES: Permite bajar por la pantalla sin que el header tape la vista
      disableScrolling={false} 
      scrollOffset={isMobile ? 80 : 100}
      spotlightPadding={isMobile ? 4 : 10}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#dc2626',
          backgroundColor: '#0f172a',
          textColor: '#f1f5f9',
          arrowColor: '#0f172a',
          overlayColor: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          // Ancho controlado para que nunca rompa la pantalla en celulares
          width: isMobile ? '88%' : 360, 
        },
        tooltip: {
          borderRadius: 16,
          padding: isMobile ? 16 : 20,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        },
        tooltipContainer: {
          textAlign: 'left',
          lineHeight: 1.5,
        },
        tooltipContent: {
          padding: '8px 0 0',
        },
        buttonNext: {
          backgroundColor: '#dc2626',
          borderRadius: 10,
          fontWeight: 900,
          textTransform: 'uppercase',
          fontSize: isMobile ? 11 : 12,
          padding: isMobile ? '10px 16px' : '12px 20px',
          letterSpacing: '0.08em',
        },
        buttonBack: {
          color: '#94a3b8',
          fontWeight: 700,
          fontSize: isMobile ? 12 : 13,
          marginRight: 8,
        },
        buttonSkip: {
          color: '#ef4444',
          fontWeight: 700,
          fontSize: isMobile ? 12 : 13,
        },
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