import React, { useState } from "react";
import {
  BriefcaseBusiness,
  TrendingUp,
  Wrench,
  Megaphone,
  HeartPulse,
  MessageCircle,
  Archive,
  ArrowRight,
  Clock,
} from "lucide-react";
import { PRODUCT_ACTIONS, getProductActionInfo, getEconomy } from "./game.js";

const money = (value) => "$" + Math.floor(value || 0).toLocaleString();
const icons = { improve: Wrench, market: Megaphone, revive: HeartPulse };
const labels = {
  growing: "Growing",
  steady: "Paying the bills",
  declining: "Losing steam",
  dead: "Dead, allegedly",
  sunset: "Retired",
};

export default function Products({
  game,
  dispatch,
  onDiscussion,
  onWorkbench,
}) {
  const [filter, setFilter] = useState("all");
  const [retiring, setRetiring] = useState(null);
  const products = game.products || [];
  const economy = getEconomy(game);
  const visible = products.filter(
    (p) =>
      filter === "all" ||
      (filter === "alive"
        ? p.dailyRevenue > 0 && p.status !== "sunset"
        : p.dailyRevenue === 0 || p.status === "sunset"),
  );
  return (
    <section className="products-panel" aria-label="Product portfolio">
      <div className="portfolio-stats">
        <div>
          <BriefcaseBusiness size={21} />
          <span>
            Products shipped<strong>{products.length}</strong>
          </span>
        </div>
        <div>
          <TrendingUp size={21} />
          <span>
            Product revenue
            <strong>
              {money(economy.productIncomePerDay)}
              <small> / day</small>
            </strong>
          </span>
        </div>
        <div>
          <span>
            Lifetime sales
            <strong>
              {money(products.reduce((sum, p) => sum + p.totalRevenue, 0))}
            </strong>
          </span>
        </div>
      </div>
      <div className="portfolio-intro">
        <div>
          <h2>Your tiny empires.</h2>
          <p>Launch day ends. Maintenance is forever.</p>
          <p>
            Day {game.day} · next payout in{" "}
            {Math.ceil(60 - (game.elapsed % 60))} simulation seconds
            {game.paused ? " · paused" : ""}
          </p>
        </div>
        <button className="secondary-button" onClick={onWorkbench}>
          Back to agents <ArrowRight size={16} />
        </button>
      </div>
      {!products.length ? (
        <div className="portfolio-empty">
          <BriefcaseBusiness size={40} />
          <h3>No empires. Excellent work–life balance.</h3>
          <p>
            Launch an idea to keep it here. Then assign idle agents to keep it
            alive.
          </p>
          <button className="primary-button" onClick={onWorkbench}>
            Find something to ship <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="portfolio-filters" aria-label="Filter products">
            {[
              ["all", "All products"],
              ["alive", "Making money"],
              ["dead", "The graveyard"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {!game.agents.some((a) => a.status === "idle") && (
            <p className="portfolio-tip">
              All agents are occupied. Ship or bin an idea to free an agent for
              product work.
            </p>
          )}
          <div className="product-grid">
            {visible.map((product) => {
              const agent = game.agents.find(
                (a) => a.projectTask?.productId === product.id,
              );
              const recent = product.history?.slice(-8) || [];
              const maxRevenue = Math.max(1, ...recent.map((d) => d.revenue));
              return (
                <article
                  className={`product-card ${product.status}`}
                  key={product.id}
                >
                  <div className="product-card-heading">
                    <span className={`product-status ${product.status}`}>
                      {labels[product.status]}
                    </span>
                    <span className="product-theme">{product.category}</span>
                  </div>
                  <h3>{product.title}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-numbers">
                    <div>
                      <strong>
                        {money(product.dailyRevenue)}
                        <small>/day</small>
                      </strong>
                      <span>Recurring revenue</span>
                    </div>
                    <div>
                      <strong>{money(product.totalRevenue)}</strong>
                      <span>Lifetime revenue</span>
                    </div>
                    <div>
                      <strong>
                        {Math.round(product.health)}
                        <small>/100</small>
                      </strong>
                      <span>Product health</span>
                    </div>
                  </div>
                  <div
                    className="revenue-chart"
                    role="img"
                    aria-label={`Revenue over the last ${recent.length} days: ${recent.map((d) => money(d.revenue)).join(", ")}`}
                  >
                    {recent.map((day, index) => (
                      <div
                        key={index}
                        title={`Day ${day.day}: ${money(day.revenue)}`}
                      >
                        <i
                          style={{
                            height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="product-update">
                    {recent.at(-1)?.note ||
                      "A real product. Your weekends have been notified."}
                  </p>
                  {agent ? (
                    <div className="product-investment">
                      <span className="spinner" />
                      <div>
                        <strong>Agent at work · {agent.name}</strong>
                        <span>
                          {PRODUCT_ACTIONS[agent.projectTask.mode]?.label} ·{" "}
                          {Math.ceil(
                            agent.duration * (1 - agent.progress / 100),
                          )}
                          s left
                        </span>
                      </div>
                    </div>
                  ) : (
                    product.status !== "sunset" && (
                      <div className="product-actions">
                        {Object.entries(PRODUCT_ACTIONS)
                          .filter(([mode]) =>
                            product.status === "dead"
                              ? mode === "revive"
                              : mode !== "revive",
                          )
                          .map(([mode, spec]) => {
                            const info = getProductActionInfo(
                              game,
                              product,
                              mode,
                            );
                            const Icon = icons[mode];
                            return (
                              <button
                                key={mode}
                                disabled={!info.enabled}
                                onClick={() =>
                                  dispatch({
                                    type: "investProduct",
                                    productId: product.id,
                                    mode,
                                  })
                                }
                              >
                                <Icon size={18} />
                                <span>
                                  <strong>{spec.label}</strong>
                                  <small>
                                    {money(info.cost)} · {info.attention}{" "}
                                    attention · {info.duration}s
                                  </small>
                                  <small
                                    className={
                                      !info.enabled
                                        ? "action-blocked"
                                        : "product-action-hint"
                                    }
                                  >
                                    {!info.enabled
                                      ? info.reason
                                      : spec.description}
                                  </small>
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )
                  )}
                  <div className="product-footer">
                    <button
                      className="discussion-link"
                      onClick={() => onDiscussion(product)}
                    >
                      <MessageCircle size={17} />
                      View launch discussion
                    </button>
                    {product.status !== "sunset" && (
                      <button
                        className="retire-button"
                        disabled={!!agent}
                        onClick={() => setRetiring(product.id)}
                        aria-label={`Retire ${product.title}`}
                      >
                        <Archive size={16} />
                        Retire
                      </button>
                    )}
                  </div>
                  {retiring === product.id && (
                    <div className="retire-confirm">
                      <strong>Retire this product?</strong>
                      <p>
                        Stop earning and investing. Keep its history as a very
                        expensive lesson.
                      </p>
                      <div>
                        <button onClick={() => setRetiring(null)}>
                          Keep it alive
                        </button>
                        <button
                          className="danger-button"
                          onClick={() => {
                            dispatch({
                              type: "sunsetProduct",
                              productId: product.id,
                            });
                            setRetiring(null);
                          }}
                        >
                          Retire product
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {!visible.length && (
            <p className="portfolio-empty">
              Nothing here. Your portfolio refuses to fit this narrative.
            </p>
          )}
          <p className="portfolio-footnote">
            <Clock size={14} />
            One game day = 60 simulation seconds. Product income can rise,
            shrink, or stop. Investment is a bet, not a guarantee.
          </p>
        </>
      )}
    </section>
  );
}

export function Discussion({ post, product, onProduct }) {
  const comments = post?.comments || product?.comments || [];
  return (
    <div className="discussion">
      <div className="discussion-original">
        <span>@you · launch day</span>
        <h3>
          {product?.title ||
            post?.productTitle ||
            "Another extremely normal launch"}
        </h3>
        <p>{post?.text || product?.launchText || product?.description}</p>
        {product && (
          <button className="secondary-button" onClick={onProduct}>
            Manage this product <ArrowRight size={16} />
          </button>
        )}
      </div>
      <div className="discussion-heading">
        <MessageCircle size={18} />
        <strong>{comments.length} replies from the simulated internet</strong>
      </div>
      {comments.length ? (
        comments.map((comment, index) => (
          <article className="comment-item" key={comment.id || index}>
            <div className="comment-avatar">
              {(comment.handle || "@reply_guy").slice(1, 2).toUpperCase()}
            </div>
            <div>
              <strong>{comment.handle || "@reply_guy"}</strong>
              <p>{comment.text}</p>
              <small>♡ {comment.likes || 0} · emotionally invested</small>
            </div>
          </article>
        ))
      ) : (
        <p className="comment-empty">
          This old launch predates the comment section. A rare moment of peace.
        </p>
      )}
      <p className="modal-footnote">
        Fictional accounts. Painfully familiar energy.
      </p>
    </div>
  );
}
