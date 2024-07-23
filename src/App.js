import './App.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Map, YMaps, withYMaps, RoutePanel, GeoObject } from '@pbe/react-yandex-maps';

function LengthPrinter({ ymaps, route }) {
  const [routeLength, setRouteLength] = useState(null);

  useEffect(() => {
    let canceled = false;
    if (ymaps && ymaps.route) {
      ymaps.route(route).then((route) => {
        if (!canceled) {
          const length = route.getHumanLength().replace('&#160;', ' ');
          setRouteLength(length);
          speak(`The route from ${route[0]} to ${route[1]} is ${length} long`);
        }
      });
    }
    return () => (canceled = true);
  }, [ymaps, route]);

  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  return routeLength ? (
    <p>
      The route from <strong>{route[0]}</strong> to{' '}
      <strong>{route[1]}</strong> is <strong>{routeLength}</strong> long
    </p>
  ) : (
    <p>Loading route...</p>
  );
}

function App() {
  const ConnectedLengthPrinter = useMemo(() => {
    return withYMaps(LengthPrinter, true, ['route']);
  }, []);

  const route = [
    { type: 'wayPoint', point: [55.751574, 37.573856], name: 'Moscow, Russia' },
    { type: 'wayPoint', point: [52.520008, 13.404954], name: 'Berlin, Germany' }
  ];

  return (
    <YMaps query={{ lang: 'en_RU', apikey: '2af4a372-b170-4a63-8e82-b904996bd01c' }}>
      <ConnectedLengthPrinter route={route.map(r => r.name)} />
      <Map defaultState={{ center: [55.751574, 37.573856], zoom: 5 }} className='map'>
        {route.map((r, index) => (
          <GeoObject
            key={index}
            geometry={{
              type: 'Point',
              coordinates: r.point
            }}
            properties={{
              iconContent: r.name
            }}
            options={{
              preset: 'islands#blueCircleIconWithCaption'
            }}
          />
        ))}
        <GeoObject
          geometry={{
            type: 'LineString',
            coordinates: route.map(r => r.point)
          }}
          options={{
            strokeColor: '#0000FF',
            strokeWidth: 4,
          }}
        />
      </Map>
    </YMaps>
  );
}

export default App;
