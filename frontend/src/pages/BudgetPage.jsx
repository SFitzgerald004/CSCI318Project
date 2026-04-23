import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getAllocation, createAllocation, getSavings, createSavings } from '../services/budgetService';
import BudgetChart from '../components/BudgetChart';
import SavingsProgress from '../components/SavingsProgress';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function BudgetPage() {
  const { id } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [amountSaved, setAmountSaved] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [alloc, savings] = await Promise.allSettled([getAllocation(id), getSavings(id)]);
      setAllocation(alloc.status === 'fulfilled' ? alloc.value : null);
      setPlan(savings.status === 'fulfilled' ? savings.value : null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newAlloc = await createAllocation(id);
      setAllocation(newAlloc);
      toast.success('Budget allocated');
    } catch {
      toast.error('Could not generate budget');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAmount(e) {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const updated = await createSavings(id, Number(amountSaved));
      setPlan(updated);
      setAmountSaved('');
      toast.success('Savings updated');
    } catch {
      toast.error('Could not update savings');
    } finally {
      setSavingPlan(false);
    }
  }

  if (loadError) {
    return <ErrorState title="Could not load budget" description="Please try again in a moment." retry={loadData} />;
  }

  if (showSkeleton) {
    return (
      <div>
        <Skeleton variant="title" className="w-64 mb-6" />
        <Skeleton variant="card" className="mb-6" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="type-section-heading">Budget</h1>
      <p className="type-caption text-text-secondary mt-1">AI-allocated budget for your trip</p>

      {!allocation ? (
        <EmptyState
          icon={<CalculatorIcon className="w-12 h-12" />}
          title="No allocation yet"
          description="Generate a smart budget split based on your trip details."
          action={<Button onClick={handleGenerate} loading={generating}>Generate Budget</Button>}
        />
      ) : (
        <>
          <Card elevated className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-card-title">Allocation</h2>
              <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
                Regenerate
              </Button>
            </div>
            <BudgetChart allocation={allocation} />
          </Card>

          <Card elevated className="mt-6">
            <h2 className="type-card-title mb-4">Savings Plan</h2>
            {plan ? (
              <SavingsProgress plan={plan} />
            ) : (
              <p className="type-caption text-text-secondary">No savings plan yet. Enter an amount to start.</p>
            )}
            <form onSubmit={handleSaveAmount} className="mt-4 flex items-end gap-3">
              <Input
                label="Amount saved so far ($)"
                type="number"
                value={amountSaved}
                onChange={setAmountSaved}
                placeholder="500"
                className="flex-1"
              />
              <Button type="submit" loading={savingPlan}>Save</Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
