import { useState, useEffect } from 'react';
import { api } from '../data/api';
import ManageList from './ManageList';

export default function ManageMovementTypes() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.movementTypes.getAll().then(setItems);
  }, []);

  return (
    <ManageList
      title="Movement Types"
      items={items}
      placeholder="e.g. Olympic, Plyometric…"
      onAdd={async name => setItems(await api.movementTypes.add(name))}
      onDelete={async name => setItems(await api.movementTypes.delete(name))}
    />
  );
}
