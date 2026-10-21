export default function ImagePlaceholder({title}: {title: string}) {
    return (
        <div className="card__image-placeholder">
            <span className="card__placeholder-text">{title}</span>
        </div>
    )
}