import { useState, useEffect } from 'react';
import { api } from '../data/api';
import ManageList from './ManageList';

export default function ManageEquipment() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.equipment.getAll().then(setItems);
  }, []);

  return (
    <ManageList
      title="Equipment"
      items={items}
      placeholder="e.g. Hammer Strength, TRX…"
      onAdd={async name => setItems(await api.equipment.add(name))}
      onDelete={async name => setItems(await api.equipment.delete(name))}
    />
  );
}
