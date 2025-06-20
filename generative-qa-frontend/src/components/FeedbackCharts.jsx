import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4caf50', '#f44336'];

const FeedbackCharts = ({ stats }) => {
    const pieData = [
        { name: 'Positive', value: stats.positive_feedbacks },
        { name: 'Negative', value: stats.negative_feedbacks },
    ];

    const flaggedQuestions = stats.most_flagged_questions.map(q => ({
        name: q,
        count: 1
    }));

    const negativeSources = stats.top_negative_sources.map(s => ({
        name: s,
        count: 1
    }));

    return (
        <div className="chart-section">
            <h3>📈 Feedback Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>

            <h3>🚩 Most Flagged Questions</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={flaggedQuestions}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7043" />
                </BarChart>
            </ResponsiveContainer>

            <h3>📚 Top Negative Sources</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={negativeSources}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3f51b5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


export default FeedbackCharts