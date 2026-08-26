import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { learnersApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { Modal } from '../components/Modal.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

function ConnectModal({ learner, isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Demo-only: this learner is fictional seed data, so there's nothing real to send to.
    // We simply confirm the interaction rather than persisting or emailing anything.
    setSent(true);
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setMessage('');
      setSent(false);
    }, 200);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Connect with ${learner.name}`}>
      {sent ? (
        <div role="status">
          <p className="text-sm text-charcoal">
            This is demo data, so nothing was actually sent — but in a real scenario, your message
            would go to <span className="font-medium">{learner.contactEmail}</span>.
          </p>
          <Button variant="secondary" onClick={handleClose} className="mt-5">Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-charcoal-soft">Interested in learning the same path?</p>
          <div>
            <label htmlFor="connect-message" className="sr-only">Message</label>
            <textarea
              id="connect-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${learner.name}, I'd love to hear about your experience with ${learner.currentPathTitle}...`}
              required
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <p className="text-xs text-charcoal-soft">
            Demo contact: <span className="font-medium">{learner.contactEmail}</span>
          </p>
          <Button type="submit" className="self-start">Send Message</Button>
        </form>
      )}
    </Modal>
  );
}

export function LearnerProfilePage() {
  const { id } = useParams();
  const [learner, setLearner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    learnersApi.getById(id).then((data) => setLearner(data.learner)).finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-56 w-full" />
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState title="Learner profile not found" description="This profile may no longer be available." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <img src={learner.avatarUrl} alt="" className="h-16 w-16 rounded-full" />
        <div>
          <h1 className="font-display text-2xl text-charcoal">{learner.name}</h1>
          <p className="text-sm text-charcoal-soft">{learner.goalTitle}</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-5 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-charcoal-soft">Started as</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-charcoal">{learner.startingLevel}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Started with</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">{learner.startingSkillLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Current level</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-charcoal">{learner.currentLevel}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Current path</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">{learner.currentPathTitle}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Courses completed</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">{learner.coursesCompleted}/{learner.totalCourses}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Projects completed</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">{learner.projectsCompleted}/{learner.totalProjects}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">Skills Gained</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {learner.skillsGained.map((skill) => (
            <SkillPill key={skill} tone="accent">{skill}</SkillPill>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">Learning Outcome</h2>
        <p className="mt-2 text-sm text-charcoal-soft">{learner.outcome}</p>
      </div>

      <p className="mt-8 text-xs text-charcoal-soft">
        Email (demo): <span className="font-medium">{learner.contactEmail}</span>
      </p>

      <div className="mt-6 flex gap-3">
        <Button to={`/journeys/${learner.journeySlug}`}>View Learning Journey</Button>
        <Button variant="secondary" onClick={() => setIsConnectOpen(true)}>Connect</Button>
      </div>

      <ConnectModal learner={learner} isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
    </div>
  );
}
