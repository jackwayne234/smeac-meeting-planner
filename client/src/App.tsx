import { useState, useEffect } from "react";
import { useHashLocation } from "wouter/use-hash-location";
import { Router, Route, Switch } from "wouter";
import HomePage from "@/pages/HomePage";
import WizardPage from "@/pages/WizardPage";
import SummaryPage from "@/pages/SummaryPage";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="min-h-screen bg-background text-foreground">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/new" component={WizardPage} />
          <Route path="/edit/:id" component={WizardPage} />
          <Route path="/summary/:id" component={SummaryPage} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
