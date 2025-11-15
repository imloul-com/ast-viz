import React from 'react';
import GrammarBuilder from '@/components/GrammarBuilder';

/**
 * Visual Builder Page
 * 
 * This page renders the GrammarBuilder component which uses the adapter pattern
 * to convert between structured rules and Ohm.js grammar text.
 * 
 * GrammarBuilder now accesses context directly via useGrammar() hook,
 * eliminating the need for prop drilling and intermediary sync logic.
 */
const GrammarVisualBuilderPage: React.FC = () => {
  return (
    <div className="mt-3">
      <GrammarBuilder />
    </div>
  );
};

export default GrammarVisualBuilderPage;

