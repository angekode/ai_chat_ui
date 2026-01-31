/**
 * Permet de descendre la barre de scroll d'un élément au plus bas maximal.
 *
 * @param element - Element html avec style overflow: scroll
 */
export function scrollToBottom(element: HTMLElement) {
    // scrollTop: 0 -> barre en haut, valeur > 0 -> barre vers le bas, indique l'offset par rapport au départ
    // clientHeight: hauteur visible de l'élément (contenu + padding, mais sans la border et la margin)
    // scrollHeight: hauteur totale de l'élément avec la partie invisible (donc l'overflow)
    // Pour scroll vers le bas il faut un offset de la hauteur total de l'élément (scrollHeight) mais sans la partie visible (clientHeight)
    element.scrollTop = element.scrollHeight - element.clientHeight;
}